const { ApolloServer, gql } = require("apollo-server");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken")

const dotenv = require("dotenv");
dotenv.config();

const { 
  DB_URI,
  DB_COUNTDOWN,
  COL_COURSEINFO,
  DB_GAMEDAY,
  COL_GAMEINFO,
  COL_GAMEUSERS,
  DB_LOGUELINK,
  COL_LINKINFO,
  COL_LINKUSERS,
  COL_TUTORIALINFO,
  JWT_SECRET 
} = process.env;

const getToken = (user) => jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

const getUserFromToken = async (token, db) => {
  if (!token) { return null }

  const tokenData = jwt.verify(token, JWT_SECRET);
  //console.log(tokenData);
  if (!tokenData?.id) {
    return null;
  }
  const found = await db.find({ _id: ObjectId(tokenData.id) });

  return found
}

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
    _id: ID
    note: String
    image: String
    game: String
    solution: String
    title: String
  }
  
  type Link {
    _id: ID
    id: String
    uri: String
    title: String
  } 
    
   type Tutorial {
      id: String
      title: String
      images: [String]
   } 

    type Mutation {
      signInGame(input: SignInInput!): AuthUser!
      signInLink(id: String, pass: String): AuthUser!

      createGame(note: String, game: String, solution: String, title: String): Boolean!
      updateGame(id: Int!, updatedGame: GameInput!): Boolean!
      deleteGame(id: ID): Boolean!

      createLink(id: String, uri: String, title: String): Boolean!
      updateLink(id: Int!, updatedGame: GameInput!): Boolean!
      deleteLink(id: ID): Boolean!

      createTutorial(id: String, title: String): Boolean!
      updateTutorial(id: Int!, updatedGame: GameInput!): Boolean!
      deleteTutorial(id: ID): Boolean!
    }

    input SignInInput {
      id: String!
      pass: String!
    }

    input GameInput {
      note: String
      game: String
      solution: String
      title: String
    }

    type AuthUser {
      user: User!
      token: String!
    }

    type User {
      id: String!
      name: String!
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
    gameSignedIn: Boolean
    
    links: [Link]
    tutorials: [Tutorial]
  }
`;

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    courses: async (root, data, context) => {
      return await context.countdownCol.find({}).toArray();
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
    games: async (root, data, context) => {
      return context.gameInfoCol.find({}).toArray();
    },
    gameSignedIn: (_, __, { user }) => {
      if (user) return true;
      return false
    },
    links: (root, data, context) => {
      return context.linkInfoCol.find({}).toArray();
    },
    tutorials: (root, data, context) => {
      return context.tutorialInfoCol.find({}).toArray();
    },
  },

  Mutation: {
    signInGame: async(_,{input}, context) => {
      const user = await context.gameUsersCol.findOne({ id: input.id });

      console.log(input);
      
      const isPasswordCorrect = user && await bcrypt.compare(input.pass, user.pass);

      if (!user || !isPasswordCorrect) {
        throw new Error('Invalid credentials!');
      }

      return {
        user,
        token: getToken(user),
      }
    },

    createGame: async(_, data, { gameInfoCol, user }) => {
     if (!user) { throw new Error('Authentication Error. Please sign in'); }
     const note = data.note;
     const game = data.game;
     const solution = data.solution;
     const title = data.title;
      const newGameTemplate = {      
        note,
        game,
        solution,
        title
      }
      const result = await gameInfoCol.insertOne(newGameTemplate);
      console.log(result.acknowledged);
      return result.acknowledged// result.ops[0];
    },

    // updateGame: async(_, { id, updatedGame  }, { gameInfoCol, user }) => {
    //   if (!user) { throw new Error('Authentication Error. Please sign in'); }

    //   const result = await gameInfoCol.updateOne({id: id}, { updatedGame})
    //   console.log(acknowledged);
    //   return result.acknowledged;
    // },

    deleteGame: async(_, { id }, { gameInfoCol, user }) => {
      if (!user) { throw new Error('Authentication Error. Please sign in'); }
      
      console.log(id);
      const result = await gameInfoCol.deleteOne({ _id: ObjectId(id) });

      console.log(result);

      return result.acknowledged;
    },

    
    signInLink: async(_,input, {linkUsersCol}) => {
      const user = await linkUsersCol.findOne({ id: input.id });

      console.log(input);
      
      const isPasswordCorrect = user && await bcrypt.compare(input.pass, user.pass);

      if (!user || !isPasswordCorrect) {
        throw new Error('Invalid credentials!');
      }

      return {
        user,
        token: getToken(user),
      }
    },

    createLink: async(_, data, { linkInfoCol, user }) => {
      if (!user) { throw new Error('Authentication Error. Please sign in'); }
      const id = data.id;
      const uri = data.uri;
      const title = data.title;
       const newLinkTemplate = {      
         id,
         uri,
         title
       }
       const result = await linkInfoCol.insertOne(newLinkTemplate);
       console.log(result.acknowledged);
       return result.acknowledged// result.ops[0];
     },

    deleteLink: async(_, { id }, { linkInfoCol, user }) => {
      if (!user) { throw new Error('Authentication Error. Please sign in'); }
      
      console.log(id);
      const result = await linkInfoCol.deleteOne({ _id: ObjectId(id) });

      console.log(result);

      return result.acknowledged;
    },

    createTutorial: async(_, data, { tutorialInfoCol, user }) => {
      if (!user) { throw new Error('Authentication Error. Please sign in'); }
      const id = data.id;
      const title = data.title;
       const newTutorialTemplate = {      
         id,
         title
       }
       const result = await tutorialInfoCol.insertOne(newTutorialTemplate);
       console.log(result.acknowledged);
       return result.acknowledged// result.ops[0];
     },

    deleteTutorial: async(_, { id }, { tutorialInfoCol, user }) => {
      if (!user) { throw new Error('Authentication Error. Please sign in'); }
      
      console.log(id);
      const result = await tutorialInfoCol.deleteOne({ _id: ObjectId(id) });

      console.log(result);

      return result.acknowledged;
    },
  },
};

const start = async () => {
  const client = new MongoClient(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  
  const countdownCol = client.db(DB_COUNTDOWN).collection(COL_COURSEINFO);

  const gameInfoCol = client.db(DB_GAMEDAY).collection(COL_GAMEINFO);
  const gameUsersCol = client.db(DB_GAMEDAY).collection(COL_GAMEUSERS);

  const linkInfoCol = client.db(DB_LOGUELINK).collection(COL_LINKINFO);
  const tutorialInfoCol = client.db(DB_LOGUELINK).collection(COL_TUTORIALINFO);
  const linkUsersCol = client.db(DB_LOGUELINK).collection(COL_LINKUSERS);

  // const temp = await gameUsersCol.find({}).toArray();
  // console.log(temp);

  

  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => {
      return {

      };
    },
    context: async ({ req }) => {

      const user = await getUserFromToken(req.headers.authorization, client.db(DB_GAMEDAY).collection(COL_GAMEUSERS) ) || '';
     
      
      return{
        user,

        countdownCol,

        gameInfoCol,
        gameUsersCol,

        linkInfoCol,
        tutorialInfoCol,
        linkUsersCol
      }
    }
    
  });

  // The `listen` method launches a web server.
  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
};

start();
