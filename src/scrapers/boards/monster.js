const axios = require('axios');
const cheerio = require('cheerio');
const Search = require('../../models/Search');

const monsterScraper = async (searchTitle, searchLocation, searchRadius, searchTimeScale, id) => {

    switch(searchRadius) {
        case '1 Mile':
            searchRadius = '2';
            break;
        case '5 Miles':
            searchRadius = '5';
            break;
        case '10 Miles':
            searchRadius = '10';
            break;
        case '15 Miles':
            searchRadius = '15';
            break;
        case '20 Miles':
            searchRadius = '20';
            break;
        default:
            searchRadius = '30';

    }

    switch(searchTimeScale) {
        case '1 Day':
            searchTimeScale = '0';
            break;
        case '3 Days':
            searchTimeScale = '3';
            break;
        case '7 Days':
            searchTimeScale = '7';
            break;
        case '14 Days':
            searchTimeScale = '14';
            break;
        default:
            searchTimeScale = '30';

    }

    const jobs = [];

    let monster = await axios.get(`https://www.monster.co.uk/jobs/search/?cy=uk&q=${searchTitle}&client=power&intcid=swoop_Hero_Search&where=${searchLocation}&rad=${searchRadius}&tm=${searchTimeScale}`)

    $ = cheerio.load(monster.data);

    $('.card-content').each((index, element) => {
                        const title = $(element)
                            .find('.title')
                            .text()
                            .trim();
                        
                        const company = $(element)
                            .find('.company')
                            .text()
                            .trim();
                        
                        const location = $(element)
                            .find('.location')
                            .text()
                            .trim()
                            .replace('\n', '');
                        
                        const link = $(element)
                            .find('.title')
                            .children('a')
                            .attr('href');
        
                            job = { title, company, location, link, source: 'Monster'}
                            if (company === '') { return }

                            jobs.push(job);
        
    });

    const checkedJobs = [];
    
    jobs.forEach(job => {

    const capitalizedTitle = searchTitle.charAt(0).toUpperCase() + searchTitle.slice(1)
    
                if(job.title.includes(capitalizedTitle)) {
                    checkedJobs.push(job);
                } else {
                    console.log(`[Rejected Job] ${job.title} - ${job.source}`);
                }
            });

    const currentSearch = await Search.findOne({ id }).exec();

    if(currentSearch !== null) {
        const filter = { id };
        const update = { jobs: [ ...currentSearch.jobs, ...checkedJobs ] };
        await Search.findOneAndUpdate(filter, update, { returnOriginal: false, useFindAndModify: false } );
    } else {
        const search = new Search({
            id,
            jobs: checkedJobs
        });
        await search.save();
    }

}

module.exports = monsterScraper