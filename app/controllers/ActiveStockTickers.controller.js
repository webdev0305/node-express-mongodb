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
  // const sizeRange = req.query.sizeRange;
  // const afterDays = req.query.afterDays;
  // const page = req.query.page;
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
    
    console.log(orConditions);
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
  
  const projection = {
    _id: 0,
    ticker: 1,
    name: 1,
    "ticker_info.Highlights.MarketCapitalization": 1,
    "ticker_info.Earnings.History" : 1
  };
  const totalCount = await database.collection('ActiveStockTickers').countDocuments(find);
  const documents = await database.collection('ActiveStockTickers').find(find).project(projection).sort({"ticker_info.Highlights.MarketCapitalization":-1}).skip(first).limit(rows).toArray();
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

// Find a single Tutorial with an id
exports.UpcomingExDividend = async (req, res) => {
  const {size_range, first, rows, page, sortField, sortOrder, afterDays} = req.body;
  // const sizeRange = req.query.sizeRange;
  // const afterDays = req.query.afterDays;
  // const page = req.query.page;
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
    
    console.log(orConditions); 
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
  
  const projection = {
    _id: 0,
    ticker: 1,
    name: 1,
    "ticker_info.Highlights.MarketCapitalization": 1,
    "ticker_info.SplitsDividends.ExDividendDate" : 1,
    "ticker_info.SplitsDividends.PayoutRatio" : 1
  };
  const totalCount = await database.collection('ActiveStockTickers').countDocuments(find);
  const documents = await database.collection('ActiveStockTickers').find(find).project(projection).sort({"ticker_info.Highlights.MarketCapitalization":-1}).skip(first).limit(rows).toArray();
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


