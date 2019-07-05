const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const Event = require('./models/event')
const User = require('./models/user')
const app = express();

const events = [];

app.use(bodyParser.json());



const user = userId => {
  return User.findById(userId)
    .then(user => {
      return { 
        ...user._doc,
        _id: user.id,
        createdEvents: event.bind(this, user._doc.createdEvents)};
    })
    .catch(err => {
      throw err;
    })
}

const event = eventIds => {
  return Event.find({_id: {$in: eventIds}})
    .then(events => {
        return events.map(event => {
          return { 
            ...event._doc, 
            _id: event.id, 
            creator: user.bind(this, event.creator)};
        })
      })
    .catch(err => {
      throw err;
    })
}


app.use(
  '/graphql', 
  graphqlHttp({
    schema: buildSchema(`
      type Event {
        _id: ID!
        title: String!
        description: String!
        price: Float!
        volume: Float!
        date: String!
        creator: User!
      }

      type User {
        _id: ID!
        email: String!
        password: String
        createdEvents: [Event!]
      }

      input EventInput {
        title: String!,
        description: String!,
        price: Float!,
        volume: Float!,
        date: String!
      }

      input UserInput {
        email: String!
        password: String!
      }

      type RootQuery{
        events: [Event!]!
      }

      type RootMutation{
        createEvent(eventInput: EventInput): Event
        createUser(userInput: UserInput): User
      }

      schema {
        query: RootQuery
        mutation: RootMutation
      }
    `),
    rootValue: {
      events: () => {
        return Event.find()
          .then(events => {
            return events.map(event => {
              return {
                ...event._doc,
                creator: {
                  ...event._doc.creator._doc,
                  _id: event._doc.creator.id,
                  creator: user.bind(this, event._doc.creator)
              }};
          })
          })
          .catch(err=>{
            throw err;
          })
      },
      createEvent: args => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: args.eventInput.price,
          volume: args.eventInput.volume,
          data: new Date(args.eventInput.date),
          creator: '5d159b368e5f97202c66b60b'
        });
        let createEvent;
        return event
          .save()
          .then(result => {
            createEvent = {...result._doc};
            return User.findById('5d159b368e5f97202c66b60b')

          })
          .then(user => {
            if(!user){
              throw new Error('No user.')
            }
            user.createEvents.push(event);
            return user.save()
          })
          .then(result => {
            console.log(result);
            return createEvent;
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
      },
      createUser: args => {
        return User.findOne({email: args.userInput.email}).then(user => {
          if(user){
            throw new Error("User existed already.");
          }
          return bcrypt
          .hash(args.userInput.password, 12)
        })
          .then(hashedPassword => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword
            });
            return user.save()
          })
          .then(result => {
            return {...result._doc, password: null}
          })
          .catch(err => {
            throw err
          });        
      }
    },
    graphiql: true
}));

const url = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-y1ybk.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
mongoose.connect(url)
  .then(()=> {
    console.log("connect to mongoDB success");
    app.listen(3000);
  }).catch(err => {
    console.log(err);
  })


