// base dependencies 
const express = require('express');
const app = require('express')();
const server = require('http').createServer(app);
const mongoose = require('mongoose');
const { uuid } = require('uuidv4');
const io = require('socket.io')(server);

// middleware

const auth = require('./src/middleware/auth');

// board scrapers

const indeedScraper = require('./src/scrapers/boards/indeed');
const reedScraper = require('./src/scrapers/boards/reed');
const monsterScraper = require('./src/scrapers/boards/monster');
const cvlibraryScraper = require('./src/scrapers/boards/cvlibrary');

// socket.io server

io.on('connection', (socket) => {
    console.log('Socket Connected');
    socket.on('message', (data) => {
        console.log('Message Received: ', data);
    });
    socket.on('disconnent', () => {
        console.log('Socket.io disconnect');
    });
});

// database 
const db = process.env.MONGOURI;

// models 
const Search = require('./src/models/Search');
const User = require('./src/models/User');
const Job = require('./src/models/Job');
const { response } = require('express');

// express setup

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(express.json());

// database set up

mongoose.connect(db || process.env.MONGOURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes

//Job Search Routes

app.post('/jobs', async (req, res) => {

    try {

        const title = req.body.title;
        const location = req.body.location;
        const radius = req.body.radius;
        const timeScale = req.body.timeScale;

        const id = uuid();

        const data = { id };
        
        res.send(data);

        indeedScraper(title, location, radius, timeScale, id)
        .then(response => {
            io.emit('message', '[Indeed] - [Success]');

        }).catch(e => {
            io.emit('message', '[Indeed] - [Failure]');
            console.log(e);
        });

        reedScraper(title, location, radius, timeScale, id)
        .then(response => {
            io.emit('message', '[Reed] - [Success]');
        })
        .catch(e => {
            console.log(e);
            io.emit('message', '[Reed] - [Failure]' );
        });

        monsterScraper(title, location, radius, timeScale, id)
        .then(response => {
            io.emit('message', '[Monster] - [Success]')
        })
        .catch(e => {
            io.emit('message', '[Monster] - [Failure]')
            console.log(e);
        })

        cvlibraryScraper(title, location, radius, timeScale, id)
        .then(response => {
            io.emit('message', '[CVLibrary] - [Success]');
        })
        .catch(e => {
            io.emit('message', '[CVLibrary] - [Failure]');
            console.log(e);
        })

    } catch (e) {
        console.log(e);
    }
    
})

app.get('/jobs/more/:id', async (req, res) => {
    console.log(req.params.id);
    try {
        
        const search = await Search.findOne({ id: req.params.id });
        
        if(!search) {
            res.status(404).send('no such search');
        }
    
        res.status(200).send(search);
                
        } catch (e) {
            console.log(e);
            res.status(500).send();
        }

});

// User Routes

app.post('/users/register', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e)
    }
})

app.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

app.post('/users/auth', async (req, res) => {
    console.log(req.body.token)
    try {        
        const user = await User.findByToken(req.body.token)
        res.send({ user })
    } catch (e) {
        res.status(400).send(e)
    }
})

app.post('/users/logout', auth, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

app.get('/users/jobs', auth, async (req, res) => {
    const match = {};
    
    if(req.query.applied) {
        match.applied = req.query.applied;
    }

    try {
        await req.user.populate({
            path: 'jobs',
            match
        }).execPopulate();
        res.send(req.user.jobs);
    } catch (e) {
        res.status(500).send();
    }
});

app.post('/users/jobs/save', auth, async (req, res) => {

    const job = new Job({
        ...req.body.job, 
        owner: req.user._id
    })

    try {
        await job.save();
        res.status(201).send();
    } catch (e) {
        res.status(400);
    }

});

// Express listener 

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server is up port ${PORT}`));




