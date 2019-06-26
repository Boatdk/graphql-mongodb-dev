const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose')

const Event = require('./models/event')
const app = express();

const events = [];

app.use(bodyParser.json());


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
      }

      input EventInput {
        title: String!,
        description: String!,
        price: Float!,
        volume: Float!,
        date: String!
      }

      type RootQuery{
        events: [Event!]!
      }

      type RootMutation{
        createEvent(eventInput: EventInput): Event
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
              return {...event._doc};
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
          data: new Date(args.eventInput.date)
        });
        return event
          .save()
          .then(result => {
            console.log(result);
            return {...result._doc};
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
      }

    },
    graphiql: true
}));

const url = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-y1ybk.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
const uri = `mongodb+srv://boatdk:<password>@cluster0-y1ybk.mongodb.net/test?retryWrites=true&w=majority`
mongoose.connect(url)
  .then(()=> {
    console.log("connect to mongoDB success");
    app.listen(3000);
  }).catch(err => {
    console.log(err);
  })


