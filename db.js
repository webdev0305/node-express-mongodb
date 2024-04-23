const { MongoClient } = require('mongodb');

async function getCollectionInfo() {
    // Create a new MongoClient
    const url = "mongodb+srv://raheel:yti2UEljRE3zOVBJ@cluster0.gtfoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    // const url = "mongodb://mttmain.mttmain:27017,mttsecondary1.mttmain:27017,mttsecondary2.mttmain:27017/?replicaSet=rs0"
    const client = new MongoClient(url);
    const startDate = new Date('2022-01-01');
    const endDate = new Date('2024-05-01');
    try {
      // // Connect to the MongoDB cluster
      await client.connect();
      const database = client.db("MobyTickMasters");
      const documents = await database.collection('ActiveStockTickers').find({"ticker_info.Highlights.MarketCapitalization":{'$gte': 40000000000}}).project({_id: 0, ticker:1, name:1, "ticker_info.Highlights.MarketCapitalization":1}).sort({"ticker_info.Highlights.MarketCapitalization":-1}).toArray();
        documents.forEach(element => {
          console.log(JSON.stringify(element, null, 2));
        });
      // const collections = await database.listCollections().toArray();
      // // collections.forEach(async collection => {

      // //     const collectionName = collection.name;
      // const results = [];

      // for (const collectionInfo of collections) {
      //   const collectionName = collectionInfo.name;
      //   if (collectionName !== 'system.indexes') {
      //     console.log(`\tCollection: ${collectionName}`);
      //     const collection = database.collection(collectionName);
      //     const pipeline = [{ $match: { t: { $gte: startDate, $lte: endDate } } }];
      //     const documents = await collection.aggregate(pipeline).toArray();
      //     results.push(documents);
      //   }
      // }

      //     const filteredData = results.flat();
      //     console.log(filteredData);
      // });
      // const documents = await database.collection("recent_prints").find().limit(1).toArray();
      //   if (documents.length > 0) {
      //     console.log('\t\tSchema:');
      //     console.log(JSON.stringify(documents[0], null, 2));
      //   } else {
      //     console.log('\t\tCollection is empty.');
      //   }
     
      // // Access the admin database
      // const adminDb = client.db().admin();
  
      // // // List all databases
      // const databases = await adminDb.listDatabases();
      // databases.databases.forEach(async db => {
      //   const dbName = db.name;
      //   console.log(`Database: ${dbName}`);
        // Access each database and list collections
        // const database = client.db(dbName);
        // const collections = await database.listCollections().toArray();
        // collections.forEach(async collection => {
        //   const collectionName = collection.name;
        //   console.log(`\tCollection: ${collectionName}`);
          
          // Retrieve the schema (first document) from each collection
          // const documents = await database.collection('HitRates_IWB').find().limit(10).toArray();
          // documents.forEach(element => {
          //   console.log(JSON.stringify(element, null, 2));
          // });
          // if (documents.length > 0) {
          //   console.log('\t\tSchema:');
          //   console.log(JSON.stringify(documents[0], null, 2));
          // } else {
          //   console.log('\t\tCollection is empty.');
          // }
        // });
      // });
    } finally {
      // Close the client connection
      await client.close();
    }
  }
  
  getCollectionInfo().catch(console.error);