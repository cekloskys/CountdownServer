const { ApolloServer, gql } = require("apollo-server");
const { MongoClient } = require("mongodb");

const dotenv = require("dotenv");
dotenv.config();

const { DB_URI, DB_COUNTDOWN, COL_COURSEINFO, DB_GAMEDAY, COL_GAMEINFO } = process.env;

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # This "Course" type defines the queryable fields for every course in our data source.
  type Course {
    divisionCode: String
    courseCode: String
    courseTitle: String
    credits: Float
    creditTypeCode: String
  }

  type Game {
    id: Int
    note: String
    image: String
    game: String
    solution: String
    title: String
  } 

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "courses" query returns an array of zero or more Courses (defined above).
  type Query {
    courses: [Course]
    coursesBy(divisionCodes: [String], courseCode: String, courseTitle: String): [Course]
    courseByDivision(divisionCodes: [String]): [Course]
    courseByCode(courseCode: String): [Course]
    courseByTitle(courseTitle: [String]): [Course]
    courseByCredits(credits: [Float]): [Course]
    courseByType(creditTypeCode: [String]): [Course]

    games: [Game]
  }
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    courses: async (root, data, context) => {
      return await context.col.find({}).toArray();
    },
    coursesBy: async (root, data, context) => {
      console.log(data);
      if ((data.courseCode == '' || data.courseCode == undefined ) && (data.courseTitle == '' || data.courseTitle == undefined ) && (data.divisionCodes.length == 0 || data.divisionCodes == undefined )) {
        return await context.countdownCol.find({}).toArray();
        
      }else if ((data.courseCode == '' || data.courseCode == undefined ) && (data.courseTitle == '' || data.courseTitle == undefined )) {
        return await context.countdownCol.find({divisionCode: {$in: data.divisionCodes}}).toArray()
        
      }else if ((data.divisionCodes.length == 0 || data.divisionCodes == undefined ) && (data.courseTitle == '' || data.courseTitle == undefined )) {
        return await context.countdownCol.find({courseCode: {"$regex":data.courseCode}}).toArray()
        
      }else if ((data.divisionCodes.length == 0 || data.divisionCodes == undefined ) && (data.courseCode == '' || data.courseCode == undefined )) {
        return await context.countdownCol.find({courseTitle: {"$regex": data.courseTitle}}).toArray()
        
      }else if ((data.divisionCodes.length == 0 || data.divisionCodes == undefined )) {
        return await context.countdownCol.find({courseCode: {"$regex": data.courseCode}, courseTitle: {"$regex": data.courseTitle}}).toArray()
        
      }else if ((data.courseCode == '' || data.courseCode == undefined )) {
        return await context.countdownCol.find({divisionCode: {$in: data.divisionCodes}, courseTitle: {"$regex": data.courseTitle}}).toArray()
        
      }else if ((data.courseTitle == '' || data.courseTitle == undefined )) {
        return await context.countdownCol.find({divisionCode: {$in: data.divisionCodes}, courseCode: {"$regex": data.courseCode}}).toArray()
        
      }else{
        // const CC_arr = await context.col.find({divisionCode: {$in: data.divisionCodes}}).toArray()
        // const DC_arr = await context.col.find({courseCode: {"$regex":data.courseCode}}).toArray()

        // const result = []
        // CC_arr.forEach((CC) => {
        //   result.push(CC)
        // })
        // for (let DC_index = 0; DC_index < DC_arr.length; DC_index++) {
        //   let found = false;
        //   for (let CC_index = 0; CC_index < CC_arr.length; CC_index++) {
        //     if (CC_arr[CC_index]['courseCode'] == DC_arr[DC_index]['courseCode']) {
        //       found = true
        //     }
        //   }
        //   if (!found) {
        //     result.push(DC_arr[DC_index])
        //   }
        // }

        // //console.log(CC_arr);
        // //console.log(DC_arr);
        // //console.log(result);

        // return result

        return await context.countdownCol.find({ divisionCode: {$in: data.divisionCodes}, courseCode: {"$regex": data.courseCode}, courseTitle: {"$regex": data.courseTitle}}).toArray()
        }

      },
    courseByDivision: async (root, {divisionCodes}, context) => {
       console.log(divisionCodes);
     // if (divisionCodes.length == 0){return await context.col.find({}).toArray();}
      return await context.countdownCol.find({divisionCode: {$in: divisionCodes}}).toArray();
    },
    courseByCode: async (root, data, context) =>  {
      return await context.countdownCol.find({courseCode: {"$regex":data.courseCode}}).toArray()
    },
    courseByTitle: (root, data, context) => {
      console.log(data);
      return context.countdownCol.find({courseTitle: {"$regex":data.courseTitle, $options: 'i'}}).toArray();
    },
    courseByCredits: (root, data, context) => {
      return context.countdownCol.find({credits: data.credits}).toArray();
    },
    courseByType: (root, data, context) => {
      return context.countdownCol.find({creditTypeCode: data.creditTypeCode}).toArray();
    },
    games: (root, data, context) => {
      return context.gameInfoCol.find({}).toArray();
    },
  },
};

const start = async () => {
  const client = new MongoClient(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  const db_countdown = client.db(DB_COUNTDOWN);
  const countdownCol = db_countdown.collection(COL_COURSEINFO)

  const db_gameday = client.db(DB_GAMEDAY);
  const gameInfoCol = db_gameday.collection(COL_GAMEINFO)
  
  // console.log(db);

  const context = {
    countdownCol, gameInfoCol
  };

  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  const server = new ApolloServer({ typeDefs, resolvers, context });

  // The `listen` method launches a web server.
  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
};

start();
