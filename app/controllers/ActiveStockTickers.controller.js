// const db = require("../models");
// const ActiveStockTickers = db.ActiveStockTickers;
const { MongoClient } = require('mongodb');
const url = "mongodb+srv://raheel:yti2UEljRE3zOVBJ@cluster0.gtfoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(url);
const database = client.db("MobyTickMasters");

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

// Retrieve all Tutorials from the database.
exports.UpcomingEarnings = async(req, res) => {
  const {size_range, first, rows, page, sortField, sortOrder, afterDays} = req.body;
  const sizeRanges = size_range.split(',');
  const today = new Date();
  
  var orConditions = [];
  if(sizeRanges.indexOf("0") !== -1){
    orConditions = []
  }else{
    const sizeRangeMapping = {
      "1": { min: 0, max: 50000000 },
      "2": { min: 50000000, max: 300000000 },
      "3": { min: 300000000, max: 2000000000 },
      "4": { min: 2000000000, max: 10000000000 },
      "5": { min: 10000000000, max: 200000000000 },
      "6": { min: 200000000000 },
    };

    // Construct the $or operator for the MongoDB find query
    orConditions = sizeRanges.map(range => {
      const { min, max } = sizeRangeMapping[range];
      if(!max){
        return { "ticker_info.Highlights.MarketCapitalization": { $gte: min } };
      }
      return { "ticker_info.Highlights.MarketCapitalization": { $gte: min, $lte: max } };
    });
  }
  var orConditions1 = [];
    
  lastDatesInRange.forEach(date => {
    orConditions1.push({
      $and: [
        {
          [`ticker_info.Earnings.History.${date}.reportDate`] : {$gte: formatedDate(today), $lte: afterDays}
        },{
          [`ticker_info.Earnings.History.${date}.epsEstimate`] : {$exists: true}
        },{
          [`ticker_info.Earnings.History.${date}.beforeAfterMarket`] : "AfterMarket"
        }
      ]
    });
  })
  if(orConditions.length === 0){
    find = {
      $or: orConditions1
    } 
  }else{
    find = { 
      $and: [ 
        {
          $or: orConditions
        },
        {
          $or: orConditions1
        } 
      ]
    };
    
  }
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
              ticker: 1,
              name: 1,
              "ticker_info.Highlights.MarketCapitalization": 1,
              "ticker_info.Earnings.History" : 1
            }
          },
          {
            $sort: {
              "ticker_info.Highlights.MarketCapitalization": -1
            }
          }
        ]
      }
    }
  ];
  
  const result = await database.collection('ActiveStockTickers').aggregate(pipeline).toArray();
  const totalCount = result[0].totalCount[0]?.total;
  const documents = result[0].documents;

    var resData = [];
    documents.forEach(item => {
      Object.keys(item.ticker_info.Earnings.History).filter(hDate => { return lastDatesInRange.includes(hDate) && item.ticker_info.Earnings.History[`${hDate}`].beforeAfterMarket === "AfterMarket" && item.ticker_info.Earnings.History[`${hDate}`].epsEstimate !== null}).map(hDate => {
        resData.push([
          item.ticker,
          item.name,
          item.ticker_info.Earnings.History[`${hDate}`].epsEstimate,
          item.ticker_info.Earnings.History[`${hDate}`].reportDate,
          item.ticker_info.Earnings.History[`${hDate}`].beforeAfterMarket == "BeforeMarket" ? "BMO" : item.ticker_info.Earnings.History[`${hDate}`].beforeAfterMarket == "AfterMarket" ? "AMC" : "",
          formatNumber(item.ticker_info.Highlights.MarketCapitalization)
        ])
      })
      
    });
    res.send({resData, totalCount});
}; 

// Find UpcomingExDividend
exports.UpcomingExDividend = async (req, res) => {
  const {size_range, first, rows, page, sortField, sortOrder, afterDays} = req.body;
  const sizeRanges = size_range.split(',');
  const today = new Date(); 
  
  var orConditions = [];
  if(sizeRanges.indexOf("0") !== -1){
    orConditions = []
  }else{
    const sizeRangeMapping = {
      "1": { min: 0, max: 50000000 },
      "2": { min: 50000000, max: 300000000 },
      "3": { min: 300000000, max: 2000000000 },
      "4": { min: 2000000000, max: 10000000000 },
      "5": { min: 10000000000, max: 200000000000 },
      "6": { min: 200000000000 },
    };

    // Construct the $or operator for the MongoDB find query
    orConditions = sizeRanges.map(range => {
      const { min, max } = sizeRangeMapping[range];
      if(!max){
        return { "ticker_info.Highlights.MarketCapitalization": { $gte: min } };
      }
      return { "ticker_info.Highlights.MarketCapitalization": { $gte: min, $lte: max } };
    });
    
  }
  const orConditions1 = {
    "ticker_info.SplitsDividends.ExDividendDate" : {$gte: formatedDate(today), $lte: afterDays}
  }
     
  if(orConditions.length === 0){
    find = orConditions1; 
  }else{
    find = { 
      $and: [ 
        {
          $or: orConditions
        },
        orConditions1
      ]
    };
    
  }
  
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
              ticker: 1,
              name: 1,
              "ticker_info.Highlights.MarketCapitalization": 1,
              "ticker_info.SplitsDividends.ExDividendDate" : 1,
              "ticker_info.SplitsDividends.PayoutRatio" : 1
            }
          },
          {
            $sort: {
              "ticker_info.Highlights.MarketCapitalization": -1
            }
          }
        ]
      }
    }
  ];
  
  const result = await database.collection('ActiveStockTickers').aggregate(pipeline).toArray();
  const totalCount = result[0].totalCount[0]?.total;
  const documents = result[0].documents;
  var resData = [];
  documents.forEach(item => {
    resData.push([
      item.ticker,
      item.name,
      item.ticker_info.SplitsDividends.ExDividendDate,
      item.ticker_info.SplitsDividends.PayoutRatio,
      formatNumber(item.ticker_info.Highlights.MarketCapitalization)
    ])
  });

  res.send({resData, totalCount});
};

exports.EconomicCalendar = async (req, res) => {
  const {date, first, rows} = req.body;
  const dateTime = new Date(date); // Start of the date range
  const endDate = new Date(dateTime.setDate(dateTime.getDate() + 1)); // End of the date range
  const startDate = new Date(date);

  find = {
    $and: [
        {
        date: {$gte: startDate, $lte: endDate}
        },
        {
        _id : {$exists: true}
        }
    ]
  }; 
  console.log(startDate,endDate )
  
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
              _id: 1,
              country_flag: 1,
              date: 1,
              type: 1,
              actual : 1,
              estimate : 1,
              previous: 1,
            }
          },
          {
            $sort: {
              date :1
            }
          }
        ]
      }
    }
  ];
  const result = await database.collection('EconomicEvents').aggregate(pipeline).toArray();
  const totalCount = result[0].totalCount[0]?.total;
  const documents = result[0].documents;
  var resData = documents;
  
  res.send({resData, totalCount});
};

// find Etfs and Stocks
exports.FindEtfsAndStocks = async (req, res) => {
  const {subString} = req.body;
  const regex = new RegExp(subString, 'i');
    find = {$or: [{ticker: { $regex: regex }}, { name: { $regex: regex }}]}; 
  
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
            $project:{
              _id: 0,
              ticker: 1,
              name: 1
            }
          },
          {
            $sort: {
              ticker: 1
            }
          }
        ]
      }
    }
  ];
  
  const result = await database.collection('ActiveStockTickers').aggregate(pipeline).toArray();
  const totalCount = result[0].totalCount[0].total;
  const documents = result[0].documents;
  var resData = [];
  documents.forEach(item => {
    resData.push({
      value: item.ticker,
      label: item.ticker + '    ' + item.name
  })
  });
  res.send({resData, totalCount});
};

// Find ETFs holders
exports.getEtfHoldings = async (req, res) => {
  const {stocker} = req.body;

  // const finnhub = require('finnhub');

  // const api_key = finnhub.ApiClient.instance.authentications['api_key'];
  // api_key.apiKey = "cot8qmpr01qgacnd25u0cot8qmpr01qgacnd25ug"
  // const finnhubClient = new finnhub.DefaultApi()
  
  // finnhubClient.etfsHoldings({'symbol': 'ARKK'}, (error, data, response) => {
  //   console.log(error,data);
  // });

    find = {$and: [{"ticker_info.ETF_Data": {$exists: true}}, {ticker: {$eq:stocker}}]}; 
  
  const pipeline = [
    {
      $match: find // Your match criteria
    },
    {
        $project:{
          _id: 0,
          "ticker_info.ETF_Data.Top_10_Holdings": 1,
          "ticker_info.ETF_Data.Holdings" : 1,
          "ticker_info.ETF_Data.TotalAssets" : 1,
          "ticker_info.ETF_Data.Asset_Allocation" : 1,
          "ticker_info.ETF_Data.Sector_Weights" : 1
        }
    }
  ];
  
  const result = await database.collection('ActiveStockTickers').aggregate(pipeline).toArray();
  // console.log(pipeline, result)
  var resData = [];
  result.forEach(item => {
    resData.push({
      "Top_10": item.ticker_info.ETF_Data.Top_10_Holdings,
      "Holdings": item.ticker_info.ETF_Data.Holdings,
      "TotalAssets" : item.ticker_info.ETF_Data.TotalAssets,
      "AssetAllocation" : item.ticker_info.ETF_Data.Asset_Allocation,
      "SectorWeights" : item.ticker_info.ETF_Data.Sector_Weights
  })
  });

  res.send({resData});
};

