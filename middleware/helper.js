const pagination = async (result, count, req, res) => {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 12;
  
    // check for limit
    if (req.query.limit <= 0) limit = 5;
  
    // check for 0 or less pages
    if (req.query.page <= 0) page = 1;
    // check for last page
    if (req.query.page > Math.ceil(count / limit))
      page = Math.ceil(count / limit);
  
    let noOfPages = Math.ceil(count / limit);
    let skip = (page - 1) * limit;
    let startPoint = skip + 1;
  
    result = result.skip(skip).limit(limit);
  
    const modelinstances = await result;
    let endPoint = modelinstances.length + skip;
    if (modelinstances.length == 0) startPoint = 0;
    // next page
    const nextPage = page + 1;
    // prev page
    let prevPage = page - 1;
    let hasNextPage = true;
    let hasPrevPage = true;
    if (nextPage > Math.ceil(count / limit)) {
      hasNextPage = false;
    }
    if (prevPage == 0) {
      hasPrevPage = false;
    }
  
    return {
      modelinstances: modelinstances,
      noOfPages: noOfPages,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
      nextPage: nextPage,
      prevPage: prevPage,
      page: page,
      count: count,
      startPoint: startPoint,
      endPoint: endPoint,
    };
    // END PAGINATION
  };

  function isDateWithinRange(dateString, comparedDateString, noOfMonth, typeNo) {
    // Convert input date string to a Date object
    var inputDate = new Date(dateString);
    
    // Define the start and end dates of the range (11/24/2023 to 29 days after)
    var startDate = new Date(comparedDateString);
    var endDate = new Date(startDate);
    var add = noOfMonth * typeNo
    endDate.setDate(endDate.getDate() + add);
  
    // Check if the input date is within the range
    if (inputDate >= startDate && inputDate <= endDate) {
      return true;
    } else {
      return false;
    }
  }

  function isTimeWithinRange(timeString, comparedTimeString, timeDifference) {
    // Convert input time string to a Date object (using a dummy date, like 01/01/2000)
    var inputTime = new Date('01/01/2000 ' + timeString);
    
    // Define the start time (9:00 AM)
    var startTime = new Date(`01/01/2000 ${comparedTimeString}`);
  
    // Calculate the end time as 4 hours after the start time
    var endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + timeDifference);
  
    // Check if the input time is between 9:00 AM and 1:00 PM (inclusive)
    return inputTime >= startTime && inputTime <= endTime;
  }


  function addDaysToDate(originalDate, numberOfDays) {
    // Parse the originalDate string to obtain a Date object
    var dateObject = new Date(originalDate);
  
    // Add numberOfDays to the date
    dateObject.setDate(dateObject.getDate() + numberOfDays);
  
    // Format the result as mm/dd/yyyy
    var formattedResult = (
      (dateObject.getMonth() + 1).toString().padStart(2, '0') + '/' +
      dateObject.getDate().toString().padStart(2, '0') + '/' +
      dateObject.getFullYear()
    );
  
    return formattedResult;
  }

  function addHoursToTime(originalTime, numberOfHours) {
    // Parse the originalTime string to obtain a Date object
    var timeObject = new Date('01/01/2000 ' + originalTime);
  
    // Add numberOfHours to the time
    timeObject.setHours(timeObject.getHours() + numberOfHours);
  
    // Format the result as hh:mm
    var formattedResult = (
      timeObject.getHours().toString().padStart(2, '0') + ':' +
      timeObject.getMinutes().toString().padStart(2, '0')
    );
  
    return formattedResult;
  }
  
  const getDate = async () => {
    const timestamp = Date.now();
    const currentDate = new Date(timestamp);
  
    const monthnames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
  
    const month = monthnames[currentDate.getMonth()];
    const day = currentDate.getDate();
    const year = currentDate.getFullYear();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
  
    const formattedDate = `${month} ${day}, ${year}, ${hours}:${minutes}`;
  
    return formattedDate;
  };

  const changeToInt = async (value, req, res) => {
    value = await Number(value);
    if (isNaN(value)) {
      value = -1234567890987654345678;
    }
  
    return value;
  };

  module.exports = {
    pagination, 
    isDateWithinRange,
    isTimeWithinRange,
    addDaysToDate,
    addHoursToTime, getDate,
    changeToInt
  }