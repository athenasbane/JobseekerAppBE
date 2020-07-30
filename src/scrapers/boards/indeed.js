const axios = require('axios');
const cheerio = require('cheerio');
const Search = require('../../models/Search');

const indeedScraper = async (searchTitle, searchLocation, searchRadius, searchTimeScale, id) => {

    switch(searchRadius) {
        case '1 Mile':
            searchRadius = '0';
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
        case '1 Week':
            searchTimeScale = '7';
            break;
        case '2 Weeks':
            searchTimeScale = '14';
            break;
        default:
            searchTimeScale = 'last';

    }

    let indeed = await axios.get(`https://www.indeed.co.uk/jobs?as_and=${searchTitle}&as_phr=&as_any=&as_not=&as_ttl=&as_cmp=&jt=all&st=&as_src=&salary=&radius=${searchRadius}&l=${searchLocation}&fromage=${searchTimeScale}&limit=10&sort=&psf=advsrch&from=advancedsearch`);
    
    const jobs = [];

    let $ = cheerio.load(indeed.data);

    $('.jobsearch-SerpJobCard').each((index, element) => {
        const title = $(element)
            .children('h2')
            .text()
            .trim()
            .replace("\n\n", "")
            .replace("new", "");
        const company = $(element)
            .find('.company')
            .text()
            .replace("\n", "");
        const location = $(element)
            .find('.location')
            .text();
        const link = $(element)
            .find('.jobtitle')
            .attr('href');

        let job = { title, company, location, link: (['https://www.indeed.co.uk', link].join('')), source: 'Indeed'};
        
        jobs.push(job);

    });

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

module.exports = indeedScraper;