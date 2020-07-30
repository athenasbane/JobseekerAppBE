const axios = require('axios');
const cheerio = require('cheerio');
const Search = require('../../models/Search');

const cvlibraryScraper = async (searchTitle, searchLocation, searchRadius, searchTimeScale, id) => {

    switch(searchRadius) {
        case '1 Mile':
            searchRadius = '1';
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
            searchTimeScale = '1';
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
            searchTimeScale = 'last';

    }

    const jobs = [];

    let cvlibrary = await axios.get(`https://www.cv-library.co.uk/${searchTitle}-jobs-in-${searchLocation}?distance=${searchRadius}&posted=${searchTimeScale}&us=1`);

    $ = cheerio.load(cvlibrary.data);

    $('.results__item').each((index, element) => {
        const title = $(element)
            .find('.job__title')
            .text()
            .trim()
            .replace('\n', '')
            .split('\n');
            
        
        const company = $(element)
            .find('.job__details-value.text--semibold')
            .text()
            .trim();
        
        const location = $(element)
            .find('.job__details-location')
            .text()
            .trim()
            .split('\n');
        
        const link = $(element)
            .find('.job__title')
            .children('a')
            .attr('href');

            job = { title: title[0], company, location: location[0], link: ['https://www.cv-library.co.uk', link].join(''), source: 'CV-Library'}
            jobs.push(job);

})

    const checkedJobs = [];
    
    jobs.forEach(job => {

    const capitalizedTitle = searchTitle.charAt(0).toUpperCase() + searchTitle.slice(1);
    
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

module.exports = cvlibraryScraper;