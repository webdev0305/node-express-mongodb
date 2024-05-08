const { MongoClient } = require('mongodb');

const url = "mongodb+srv://raheel:yti2UEljRE3zOVBJ@cluster0.gtfoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(url);

async function getCollectionInfo() {
    // Create a new MongoClient
    
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
        
    } finally {
      // Close the client connection
      await client.close();
    }
  }

  async function processETFs() {
    await client.connect()
    var database = client.db("MobyTickMasters")
    const cursor = await database.collection('ActiveStockTickers').find({"ticker_info.ETF_Data": {$exists: true}}).project({ticker: 1, "ticker_info.ETF_Data": 1}).toArray();
    for (let etfdata of cursor){
      if (!("ETF_Data" in etfdata.ticker_info)) continue;
      if (!("TotalAssets" in etfdata.ticker_info.ETF_Data)) continue;
      if (!("Holdings" in etfdata.ticker_info.ETF_Data)) continue;
  
      const etf = etfdata.ticker
      const assets = etfdata.ticker_info.ETF_Data.TotalAssets
      const holdings = etfdata.ticker_info.ETF_Data.Holdings
      const holdings_keys = Object.keys(holdings)
      
      for (let holding of holdings_keys) {
        if (holding.substr(-3) != ".US") continue;
        const ticker = holding.substr(0,holding.length-3)
        const assets_percent = holdings[ticker+".US"]["Assets_%"]
        const assets_value = assets_percent * assets / 100
        const doc = await database.collection('ActiveStockTickers').findOne({ticker:ticker})
        if (doc) {
          try{
            let update = {$set:{}}
            update.$set["ticker_info.holders."+etf+".percent"] = assets_percent
            update.$set["ticker_info.holders."+etf+".value"] = assets_value
  
            await database.collection('ActiveStockTickers').updateOne({"ticker":ticker}, update);
            console.log(ticker, assets_percent, assets_value)
          }catch(err) {
            console.log(err)
          }
        }
        
      }
      console.log("etf",etf)
    }
    return 1
  }

  // getCollectionInfo().catch(console.error);
  processETFs();