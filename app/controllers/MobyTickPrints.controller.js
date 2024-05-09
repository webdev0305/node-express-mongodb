// const db = require("../models");
const axios = require('axios');
// const ActiveStockTickers = db.ActiveStockTickers;
const { MongoClient } = require('mongodb');
const url = "mongodb+srv://raheel:yti2UEljRE3zOVBJ@cluster0.gtfoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(url);
const database = client.db("MobyTickPrints");

const formatNumber = (num) => {
  // const number = parseFloat(num.replace(/,/g, ''));
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  if (num >= 1) {
    return (num / 1).toFixed(2);
  }
  return num;
};

const formatedDate = (date) => {
  return date.toISOString().split('T')[0];
}

function getLastDateOfMonth(year, month) {
  // Initialize a Date object to the first day of the next month
  const nextMonth = new Date(year, month + 1, 1);
  // Subtract 1 millisecond to get the last day of the current month
  return new Date(nextMonth.setDate(nextMonth.getDate() - 1));
  // return new Date(nextMonth - 1);
}

function getLastDatesInRange(startDate, endDate) {
  const lastDates = [];
  // Initialize the current date to the start date of the range
  let currentDate = new Date(startDate);
  // Loop until the current date is before or equal to the end date
  while (currentDate <= endDate) {
    // Get the last date of the current month and push it to the array
    const lastDateOfMonth = getLastDateOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    lastDates.push(formatedDate(lastDateOfMonth));
    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return lastDates;
}

// Example usage:
const today = new Date();
const startDate = new Date(today.getFullYear(), today.getMonth()-3);
const endDate = new Date(today.getFullYear(), today.getMonth()+2);
const lastDatesInRange = getLastDatesInRange(startDate, endDate);

exports.LatestPrints = async (req, res) => {
  const apiUrl = 'https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=SPY,QQQ,IWM,DIA&include_otc=false&apiKey=oXfbCUrTqSkbY0pUrxc0OFDN7FMiU95i';
  var apiData = await axios.get(apiUrl);
  
  // Perform queries for each collection
  var LatePrintsDIA = await database.collection('LatePrintsDIA').find().sort({t: -1}).limit(1).toArray();
  var LatePrintsIWM = await database.collection('LatePrintsIWM').find().sort({t: -1}).limit(1).toArray();
  var LatePrintsQQQ = await database.collection('LatePrintsQQQ').find().sort({t: -1}).limit(1).toArray();
  var LatePrintsSPY = await database.collection('LatePrintsSPY').find().sort({t: -1}).limit(1).toArray();
  var results = [];
  apiData.data.tickers.forEach((ticker, index) => {
    results[index] = {};
     results[index].ticker = ticker.ticker;
    results[index].Current = ticker.lastTrade.p.toFixed(2);
    results[index].Volume = ticker.min.v;
    results[index].Close = ticker.min.c.toFixed(2);
    results[index].Value = ticker.min.v * ticker.min.vw;
    switch (ticker.ticker) {
      case 'QQQ':
        results[index].LeviPrice = LatePrintsQQQ["0"].p.toFixed(2);
        return;
      case 'IWM':
        results[index].LeviPrice = LatePrintsIWM["0"].p.toFixed(2);
        return;
      case 'SPY':
        results[index].LeviPrice = LatePrintsSPY["0"].p.toFixed(2);
        return;
      case 'DIA':
        results[index].LeviPrice = LatePrintsDIA["0"].p.toFixed(2);
        return;
    }
    
  });
  // Merge results into a single array
  
    
  res.send({results});
};

exports.Prints = async (req, res) => {
  const {size, date, first, rows, page, sortField, sortOrder} = req.body;
  const dateTime = new Date(date); // Start of the date range
  const endDate = new Date(dateTime.setDate(dateTime.getDate() + 1)); // End of the date range
  const startDate = new Date(date);
  console.log(startDate, endDate, size)
  find = {
    $and: [
      {
      t: {$gte: startDate, $lte: endDate},
      },
      // {
      //   s: {$gte: size},
      // },
      {
      _id : {$exists: true}
      }
    ]
  }; 
  
  const pipeline = [
    {
      $match: find // Your match criteria
    },
    {
      $facet: {
        totalCount: [
          {
            $count: "total"
          }
        ],
        documents: [
          {
            $skip: first // Skip the first 'first' documents
          },
          {
            $limit: rows // Limit the number of documents returned to 'rows'
          },
          {
            $project:{
              _id: 0,
              sym: 1,
              p: 1,
              s : 1
            }
          },
          {
            $sort: {
              sym: 1
            }
          }
        ]
      }
    }
  ];
  
  const result = await database.collection('SecretSignalPrints').aggregate(pipeline).toArray();
  const totalCount = result[0].totalCount[0]?.total;
  const documents = result[0]?.documents;
  res.send({documents, totalCount});
};
