"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
window.cordova = window.cordova || undefined;
window.device = window.device || undefined;
window.jmfw = window.jmfw || $;
window.jQuery = window.jQuery || undefined;
window.localFileSystem = window.localFileSystem || undefined;
window.mCapture = window.mCapture || undefined;
window.requestFileSystem = window.requestFileSystem || undefined;
var Driver = /** @class */ (function () {
    function Driver(d) {
        if (d) {
            this.token = d["token"] || "";
            this.id = d["id"] || "";
            this.name = d["name"] || "";
            this.email = d["email"] || "";
            this.vehicleReg = d["vehicleReg"] || "";
            this.supplierId = d["supplierId"] || "";
            this.jobs = d["jobs"] || [];
        }
    }
    Driver.getProperty = function (p) {
        var driver = Driver.getDriver();
        if (Helper._undefinedOrNull(driver))
            return "";
        return driver[p];
    };
    Driver.getDriver = function () {
        var driver = new Driver(window.dataManager.getItem("driver"));
        return driver;
    };
    // Run a data request for all jobs for the current driver token
    Driver.getJobs = function (alwaysCallback) {
        var msg = { "token": Driver.getToken() };
        window.commsManager.sendMessage({
            endpoint: options.endpoint.allData,
            isImmediate: true,
            message: msg,
            callback: {
                success: Driver.driverDataResponse,
                error: null
            }
        });
    };
    Driver.getToken = function () {
        return Driver.getProperty("token");
    };
    Driver.getName = function () {
        return Driver.getProperty("name");
    };
    Driver.getEmail = function () {
        return Driver.getProperty("email");
    };
    Driver.getVehicleReg = function () {
        return Driver.getProperty("vehicleReg");
    };
    // Receive a driver data response and deal with the response.
    Driver.driverDataResponse = function (responseData) {
        if (!responseData.success) {
            AppManager.dealWithError({
                text: "There was a problem fetching job data (1). Please try again later."
            });
            return false;
        }
        // Connected and got data:
        // Get the driver's details from the returned data and set the data on the page.
        if (Helper._undefinedOrNull(responseData.message)) {
            AppManager.dealWithError({
                text: "There was a problem fetching job data (2). Please try again later."
            });
            return false;
        }
        var driverData = null;
        // Driver data is stringified.
        try {
            driverData = JSON.parse(responseData.message);
        }
        catch (e) {
            AppManager.dealWithError({
                text: "There was a problem fetching job data (3). Please try again later."
            });
            return false;
        }
        if (Helper._undefinedOrNull(driverData.driverId)) {
            AppManager.dealWithError({
                text: "There was a problem fetching job data (4). Please try again later."
            });
            return false;
        }
        // Complete the driver details held locally
        var driver = Driver.getDriver();
        driver.id = driverData.driverId;
        driver.name = driverData.name;
        driver.email = driverData.email;
        driver.vehicleReg = driverData.vehicleReg;
        driver.supplierId = driverData.supplierId;
        driver.save();
        // Now that we have a driver, set up the listener channel for job updates, passing in the function to call when
        // new updates are received.
        window.commsManager.pushListenerAddChannel(driver.id.toString());
        // Store the current list of jobs locally
        var jobs = driverData.jobs;
        // Bit of manipulation.
        //...
        // 1. The job objects returned will use bookingRef as the unique identifier, adding an ID property to the job data here for local use / clarity.
        // 2. We store 'unit' as requiredMeasurement, so grab that from "unit" here.
        jobs.forEach(function (j) {
            j["id"] = j.bookingRef || "";
            j["datetime"] = moment(j.date, CONSTANTS.INCOMING_DATE_FORMAT).hours(j.startHour || 0);
            j["requiredMeasurement"] = j["unit"] || "";
        });
        window.dataManager.setItem("jobs", jobs);
        // Ensure the jobs are in chronological order
        JobList.sortJobs();
        window.jmfw(PageConfig.Jobs.tagName)[0].redraw();
    };
    // Save the driver in its current state to local storage.
    Driver.prototype.save = function () {
        var driver = window.dataManager.getItem("driver");
        driver = this;
        window.dataManager.setItem("driver", driver);
        return this;
    };
    return Driver;
}());
var Helper = /** @class */ (function () {
    function Helper() {
    }
    //...
    // General variable checking functions.
    //...
    Helper._undefinedNullOrEmptyString = function (v) {
        return Helper._undefinedOrNull(v) || v === "";
    };
    Helper._undefinedNullOrNaN = function (v) {
        return Helper._undefinedOrNull(v) || (isNaN(v) && v !== 0);
    };
    Helper._undefinedNullOrEmptyArray = function (v) {
        return Helper._undefinedOrNull(v) || !Array.isArray(v) || v.length === 0;
    };
    Helper._undefinedOrNull = function (v) {
        return v === undefined || v === null;
    };
    Helper._booleanValue = function (v) {
        if (Helper._undefinedOrNull(v))
            return false;
        if (typeof v === "string")
            v = v.toUpperCase();
        return v === true ||
            v === 1 ||
            v === "1" ||
            v === "TRUE" ||
            v === "YES" ||
            v === "Y" ||
            v === "ON" ||
            v === "OK";
    };
    Helper._stringValue = function (v) {
        return v.toString();
    };
    Helper._numericValue = function (v) {
        if (Helper._undefinedNullOrEmptyString(v))
            v = 0;
        var asNumeric = parseInt(v);
        if (isNaN(asNumeric))
            asNumeric = 0;
        return asNumeric;
    };
    // Returns the left hand side (whole number) of a floating point number (output as requested).
    Helper._getWholeNumber = function (v, output) {
        if (Helper._undefinedNullOrNaN(v))
            return 0;
        var whole = parseInt(v.toString());
        if (output && output === "number")
            return whole;
        return whole.toString();
    };
    // Returns the right hand side of a floating point number (output as requested).
    Helper._getFloatingValue = function (v, output) {
        if (Helper._undefinedNullOrNaN(v))
            return 0;
        var stringValue = v.toString(), floating = stringValue.substr(stringValue.indexOf(".") + 1);
        if (output && output === "string")
            return floating;
        return parseInt(floating);
    };
    // Finds the closest value to the given number in the given array.
    Helper._closestValue = function (arr, v) {
        // reducer.js
        var reducer = function (goal, previous, current) {
            return (Math.abs(current - goal) < Math.abs(previous - goal) ? current : previous);
        };
        return arr.reduce(reducer.bind(null, v));
    };
    //...
    // String functions.
    //...
    // Returns the first word from a given string sentence.
    Helper._firstWord = function (s) {
        if (s.indexOf(" ") === -1) {
            return s;
        }
        else {
            return s.substr(0, s.indexOf(" "));
        }
    };
    // Forces the first character of each word into uppercase - i.e. 'proper' case.
    Helper._toProperCase = function (s) {
        if (typeof s !== "string" || Helper._undefinedNullOrEmptyString(s))
            return "";
        var newS = "";
        s.split(" ").forEach(function (word) {
            word = word.substr(0, 1).toUpperCase() + word.substr(1);
            newS = Helper._stringSuffix(newS, word, " ");
        });
        return newS;
    };
    // Returns the string between two given parts.
    // ...
    // E.g using:
    //    Helper._between("Part 1: Some text", "Part 1: ", " text")
    // returns "Some"
    //
    //// NB: can also be used to find the string after or beforea given point:
    // E.g using:
    //    Helper._between("Part 1: Some text", "Part 1: ")
    // returns "Some text"
    // ...
    // Using:
    //    Helper._between("Part 1: Some text", false, " text")
    // returns "Part 1: Some"
    // static _between(s: string, from?: string | boolean, until?: string): string {
    //   if (typeof s !== "string" || Helper._undefinedNullOrEmptyString(s))
    //     return "";
    //   // We need a start value, otherwise we'll return strange (potentially unwanted) results...
    //   if (typeof from !== "string" || Helper._undefinedNullOrEmptyString(from))
    //     return "";
    //   // Allow this to be used to from and until as well.
    //   if (typeof from === "string" && from && !until) {
    //     return s.substring(s.indexOf(from) + from.length);
    //   } else if (!from && until) {
    //     return s.substring(0, s.indexOf(until));
    //   } else if (typeof from === "string" && from && until) {
    //     return s.substring(s.indexOf(from) + from.length, s.indexOf(until));
    //   }
    //   return "";
    // }
    Helper._between = function (s, from, until) {
        if (typeof s !== "string" || s === null)
            return "";
        var startIndex = 0, endIndex = s.length;
        // Start from 'from' if we've got it, otherwise start at the beginning!
        if (typeof from !== "string" || from === null) {
            startIndex = 0;
        }
        else {
            if (!Helper._inString(s, from))
                return "";
            startIndex = s.indexOf(from) + from.length;
        }
        if (until && Helper._inString(s, until))
            endIndex = s.indexOf(until);
        return s.substring(startIndex, endIndex);
    };
    Helper._inString = function (s, v) {
        if (typeof s !== "string" || Helper._undefinedNullOrEmptyString(s) || typeof v !== "string" || Helper._undefinedNullOrEmptyString(v))
            return false;
        return s.indexOf(v) > -1;
    };
    // Returns the original string with the additional string concatenated, using the given separator or a space.
    // This helper method is used to avoid needing to check for a string's emptiness inline  before adding another string.
    //...
    // E.g using:
    //    Helper._stringSuffix("Word 1", "Word 2", ", ")
    // returns "Word 1, Word 2"
    //     using:
    //    Helper._stringSuffix(someEmptyVar, "Word 2", ", ")
    // returns "Word 2"
    Helper._stringSuffix = function (original, addition, separator) {
        var sep = separator || " ";
        if (Helper._undefinedNullOrEmptyString(original))
            return addition;
        return original + Helper._stringAdd(addition, sep);
    };
    // Make use of the suffix function, just passing strings the other way round.
    Helper._stringPrefix = function (original, addition, separator) {
        return Helper._stringSuffix(addition, original, separator || " ");
    };
    // If the given value is not blank, add the separator (or default to a space) and return.
    Helper._stringAdd = function (str, separator) {
        if (Helper._undefinedNullOrEmptyString(str))
            return "";
        return (separator || " ") + str;
    };
    Helper._padLeft = function (value, padLength, padWith) {
        if (Helper._undefinedOrNull(value))
            value = "";
        value = value.toString();
        if (padLength < 0)
            padLength = 0;
        return Array(padLength - value.length + 1).join(padWith || "0") + value;
    };
    Helper._padRight = function (value, padLength, padWith) {
        if (Helper._undefinedOrNull(value))
            value = "";
        value = value.toString();
        if (padLength < 0)
            padLength = 0;
        return value + Array(padLength - value.length + 1).join(padWith || "0");
    };
    // Returns whether or not the given regex matches the given string.
    Helper._regexMatch = function (str, regex, flags) {
        var r = new RegExp(regex, flags || CONSTANTS.REGEX.FLAGS.GLOBAL);
        return str.match(r) !== null;
    };
    // Returns a new string with matches for the given regex replaced with the given replacement.
    Helper._regexReplace = function (original, pattern, replacement, flags) {
        var r = new RegExp(pattern, flags !== '' ? flags : '');
        return original.replace(r, replacement || "");
    };
    // Replaces any non-alphanumeric character with a given replacement.
    // First regex replaces all, second ensures there is only one repeating replacement character - so runing this on 'something & something     else'
    // will return 'something-something-else' rather than 'something---something-----else'.
    // Which is nice.
    Helper._safeId = function (original, replacement) {
        var stripNonAlphaNumericRegex = new RegExp("[^a-z0-9]", CONSTANTS.REGEX.FLAGS.CASE_INSENSITVE + CONSTANTS.REGEX.FLAGS.GLOBAL);
        var replaced = original.replace(stripNonAlphaNumericRegex, replacement || "");
        // If we have replaced with something other than a blank string, check for duplicates here before returning.
        if (replacement) {
            var stripReplacementRegex = new RegExp(replacement + "+", CONSTANTS.REGEX.FLAGS.CASE_INSENSITVE + CONSTANTS.REGEX.FLAGS.GLOBAL);
            replaced = replaced.replace(stripReplacementRegex, replacement || "");
        }
        return replaced;
    };
    //...
    // Object functions.
    //...
    // Returns an empty callback function which is useful for using mCapture functions from pure TS/JS.
    Helper._emptyCallback = function () {
        var resume = function (e) { console.log(e); };
    };
    // Returns an object from an array based on a single property value.
    Helper._getObjectFromArrayByPropertyValue = function (a, p, v) {
        if (Helper._undefinedNullOrEmptyArray(a) || Helper._undefinedNullOrEmptyString(v))
            return undefined;
        var oArray = a.filter(function (arrValue, arrIndex) {
            if (typeof arrValue === "object" && arrValue.hasOwnProperty(p) && arrValue[p] === v)
                return arrValue;
        });
        // If we found a match, return it.
        if (!Helper._undefinedNullOrEmptyArray(oArray))
            return oArray[0];
        return undefined;
    };
    //...
    // Date functions
    //...
    Helper._dates_getISOString = function (d) {
        var m = moment();
        if (!Helper._undefinedOrNull(d))
            m = moment(d);
        // Check we've got a valid moment
        if (typeof m === "object" && typeof m.format === "function")
            return Helper._dates_format(m);
    };
    Helper._dates_getUnixTimestamp = function (d) {
        var m = moment();
        if (!Helper._undefinedOrNull(d))
            m = moment(d);
        // Check we've got a valid moment
        if (typeof m === "object")
            return Helper._dates_format(m, "X");
    };
    Helper._dates_format = function (m, f) {
        // If no date is passed, create a new moment
        if (Helper._undefinedOrNull(m) || !m["_isAMomentObject"])
            m = moment();
        // If no format is passed, return an ISO string.
        if (Helper._undefinedNullOrEmptyString(f))
            return m.toISOString();
        return m.format(f);
    };
    Helper._twoDigitTime = function (v) {
        var numericValue = v;
        if (typeof v === "string")
            numericValue = parseInt(v);
        return (numericValue < 10 ? "0" : "") + numericValue.toString();
    };
    //...
    // Number functions.
    //...
    Helper._getValidPercentage = function (perc, outputType) {
        if (Helper._undefinedOrNull(perc)) {
            perc = "0";
        }
        else {
            perc = perc.toString().replace(/[^\d]+/g, '');
            // No individual value can be more than 100%. Total will be checked separately.
            if (parseInt(perc) > 100)
                perc = perc.substring(0, perc.length - 1);
            if (perc.length > 0)
                // Convert the remaining value to an int - mainly at this stage to trim leading zeros.
                perc = parseInt(perc).toString();
            // We always want to return a 'valid' percentage - i.e. within 0-100.
            if (perc === "")
                perc = "0";
        }
        return outputType === "string" ? Helper._stringValue(perc) : Helper._numericValue(perc);
    };
    // Uses the built-in guid generation function - should be good enough.
    Helper._uuid = function () {
        return window.mCapture.db.guid();
    };
    return Helper;
}());
var Job = /** @class */ (function () {
    function Job(j) {
        this.id = j["id"] || j["bookingRef"];
        this.bookingRef = j["bookingRef"] || "";
        this.date = j["date"];
        this.datetime = moment(j["date"], CONSTANTS.INCOMING_DATE_FORMAT).hours(j["startHour"] || 0);
        this.startHour = Number(j["startHour"]) || null;
        this.endHour = Number(j["endHour"]) || null;
        this.isFailing = j["isFailing"] || false;
        this.service = j["service"] || "";
        this.movementCode = j["movementCode"] || "";
        this.movementDesc = j["movementDesc"] || "";
        this.companyName = j["customerName"] || ""; // Apparently.
        this.customerName = j["customerName"] || "";
        this.contractName = j["contractName"] || "";
        this.sicCode = j["sicCode"] || "";
        this.ewcCode = j["ewcCode"] || "";
        this.wasteCarrierName = j["wasteCarrierName"] || "";
        this.wasteDescription = j["wasteDescription"] || "";
        this.wasteCarrierRegNo = j["wasteCarrierRegNo"] || "";
        this.wcl = j["wasteCarrierRegNo"] || "";
        this.supplierLogo = j["supplierLogo"] || "";
        this.disposalSite = j["disposalSite"] || "";
        this.siteContactName = j["siteContactName"] || "";
        var siteContactEmail = [];
        if (j['siteContactEmail']) {
            if (Array.isArray(j['siteContactEmail'])) {
                siteContactEmail = j['siteContactEmail'];
            }
            else {
                siteContactEmail = [j['siteContactEmail']];
            }
            // Email addresses will come back padded to 80 characters so trim that out...
            siteContactEmail = siteContactEmail.map(function (e) { return e.replace(/\s/g, ''); });
        }
        this.siteContactEmail = siteContactEmail;
        this.pointOfDeposit = j["pointOfDeposit"] || "";
        this.address1 = j["address1"] || "";
        this.address2 = j["address2"] || "";
        this.address3 = j["address3"] || "";
        this.address4 = j["address4"] || "";
        this.postcode = j["postcode"] || "";
        // Build the special instructions array from the individual fields (starting at 1) - if we've got individual fields, otherwise use the existing array as
        // we're not dealing with a new job.
        if (!Helper._undefinedNullOrEmptyString(j["specialInstructions1"])) {
            this.specialInstructions = [];
            for (var i = 1; i <= CONSTANTS.MAX_SPECIAL_INSTRUCTIONS; i++) {
                if (!Helper._undefinedNullOrEmptyString(j["specialInstructions" + (i)]))
                    this.specialInstructions.push(j["specialInstructions" + (i)]);
            }
        }
        else {
            this.specialInstructions = j["specialInstructions"] || [];
        }
        this.orderInstructions = j["orderInstructions"] || "";
        this.driverStatus = j["driverStatus"] || "";
        this.eta = j["eta"] || "";
        this.streams = j["streams"] || [];
        this.requireStreams = this.streams.length > 0;
        this.hasCheckedStreams = j["hasCheckedStreams"] || false;
        this.requiredMeasurement = j["requiredMeasurement"].toLowerCase() || CONSTANTS.MEASUREMENTS.TONNES; // Default to tonnes if we haven't been sent anything.
        this.gross = !Helper._undefinedNullOrNaN(j["gross"]) ? j["gross"] : null;
        this.tare = !Helper._undefinedNullOrNaN(j["tare"]) ? j["tare"] : null;
        this.nett = !Helper._undefinedNullOrNaN(j["nett"]) ? j["nett"] : null;
        this.adhocPhotos = j["adhocPhotos"] || [];
        this.clientName = j["clientName"] || "";
        this.clientSignature = j["clientSignature"] || "";
        this.clientSignatureStamp = j["clientSignatureStamp"] || "";
        this.driverName = j["driverName"] || "";
        this.driverSignature = j["driverSignature"] || "";
        this.driverSignatureStamp = j["driverSignatureStamp"] || "";
        this.requireClientSignature = j["requireClientSignature"] || true;
        this.requireDriverSignature = j["requireDriverSignature"] || true;
        this.failureReason = j["failureReason"] || "";
        this.failurePhotos = j["failurePhotos"] || [];
        this.notes = j["notes"] || "";
        this.serviceAmendments = j["serviceAmendments"] || "";
        this.comments = j["comments"] || "";
    }
    // Set the job status of this instance.
    // This is the main function that will deal with the API - updating job statuses by sending the appropriate information and reacting accordingly.
    Job.prototype.setStatus = function (status) {
        this.driverStatus = status;
        return this.save();
    };
    Job.prototype.getStream = function (stream) {
        var ms = this.streams.filter(function (s) {
            return s.streamId.toString() === stream;
        });
        return Array.isArray(ms) && ms.length === 1 ? ms[0] : null;
    };
    // Validate the provided stream and save against the job.
    Job.prototype.setStream = function (id, value) {
        // Simple check to ensure each measurement has a value.
        var stream = this.getStream(id);
        if (Helper._undefinedOrNull(stream))
            return false;
        stream.value = value;
        this.save();
        return true;
    };
    Job.prototype.outputDateString = function () {
        return Helper._dates_format(this.datetime, "DD/MM/YYYY");
    };
    Job.prototype.outputTimeString = function () {
        // startHour and endHour refer to earliest and latest possible times for the movement to begin.
        var timeStr = "";
        if (!Helper._undefinedNullOrNaN(this.startHour))
            timeStr += (this.startHour < 10 ? "0" : "") + this.startHour.toString() + ":00";
        // If we've got a timeStr, format appropriately (depending on whether or not we have an endHour as well).
        if (!Helper._undefinedNullOrEmptyString(timeStr))
            timeStr += "+";
        // Add the end hour if we've got one.
        if (!Helper._undefinedNullOrNaN(this.endHour)) {
            // If we don't have a startHour, this is the latest time for the movement so display that.
            if (!Helper._undefinedNullOrEmptyString(timeStr))
                timeStr += " ";
            timeStr += "-";
            timeStr += (this.endHour < 10 ? "0" : "") + this.endHour.toString() + ":00";
        }
        return timeStr;
    };
    Job.prototype.outputAddressString = function () {
        return Helper._stringAdd(this.address1, " ") + Helper._stringAdd(this.address2, ", ") + Helper._stringAdd(this.address3, ", ") + Helper._stringAdd(this.address4, ", ") + Helper._stringAdd(this.postcode, ", ");
    };
    Job.prototype.formatEta = function (hours, mins, ampm) {
        if (Helper._undefinedNullOrNaN(hours) || Helper._undefinedNullOrNaN(mins) || Helper._undefinedNullOrEmptyString(ampm))
            return "";
        return Helper._twoDigitTime(hours) + ":" + Helper._twoDigitTime(mins) + ampm.toUpperCase();
    };
    Job.prototype.outputSpecialInstructions = function () {
        var output = "";
        this.specialInstructions.forEach(function (instruction) {
            output = Helper._stringSuffix(output, instruction, ", ");
        });
        return output;
    };
    // Checks if the current job has been signed off by the driver.
    Job.prototype.isDriverSigned = function () {
        return !Helper._undefinedNullOrEmptyString(this.driverName) && !Helper._undefinedNullOrEmptyString(this.driverSignature);
    };
    // Checks if the current job has been signed off by the client.
    Job.prototype.isClientSigned = function () {
        return !Helper._undefinedNullOrEmptyString(this.clientName) && !Helper._undefinedNullOrEmptyString(this.clientSignature);
    };
    // Checks if the current job is being marked as failed.
    Job.prototype.isBeingFailed = function () {
        return this.isFailing;
    };
    // Checks if the current job has been started.
    Job.prototype.isStarted = function () {
        return this.driverStatus === CONSTANTS.JOB_STATUS.INITIATED.identifier;
    };
    // Checks if the current job is complete.
    Job.prototype.isComplete = function () {
        return this.driverStatus === CONSTANTS.JOB_STATUS.COMPLETE.identifier;
    };
    // Reset anything that could have been edited by the user.
    Job.prototype.reset = function () {
        this.driverStatus = "";
        this.eta = null;
        // Reset any stream edits
        this.streams.forEach(function (s) {
            s.value = null;
        });
        this.hasCheckedStreams = false;
        this.gross = null;
        this.tare = null;
        this.nett = null;
        this.adhocPhotos = [];
        this.clientName = "";
        this.clientSignature = "";
        this.clientSignatureStamp = null;
        this.driverName = "";
        this.driverSignature = "";
        this.driverSignatureStamp = null;
        this.serviceAmendments = "";
        this.comments = "";
        this.notes = "";
        this.failureReason = null;
        this.failurePhotos = [];
        this.save();
    };
    // Save the current job instance back to local storage and sends the updated job to the API (unless told otherwise).
    Job.prototype.save = function (localOnly) {
        var _this = this;
        var jobs = window.dataManager.getItem("jobs");
        if (!Array.isArray(jobs) || jobs.length < 1) {
            window.logManager.log("Could not retrieve job list from local storage");
            return;
        }
        var jobIndex = jobs.findIndex(function (el, i, a) { return el.id === _this.id; });
        // Check if we're adding or updating.
        if (jobIndex === -1) {
            // Adding
            jobs.push(this);
        }
        else {
            //Updating    
            jobs[jobIndex] = this;
        }
        window.dataManager.setItem("jobs", jobs);
        return this;
    };
    // Push up job updates at specific times to the API.
    Job.pushJobUpdates = function () {
        var job = Job.getCurrentJob();
        // Add any properties which may not be saved at job-level in the app...
        //
        // Properties used server-side:
        //
        // PDF placeholder        |     Job property
        // ------------------------------------------------------------
        // supplierLogo:                job.supplierLogo
        // bookingRef:                  job.bookingRef
        // contractNo:                  job.contractNo
        // movementDate:                job.date
        // customerName:                job.customerName
        // customerSICCode:             job.customerSICCode
        // siteAddress:                 address
        // containerType:               job.movementDesc
        // wasteDescription:            job.wasteDescription
        // ewcCode:                     job.ewcCode
        // serviceCode:                 job.movementCode
        // specialInstructions:         job.specialInstructions
        // customerSignature:           job.clientSignature
        // customerSignedName:          job.clientName
        // customerSignedDateTime:      job.clientSignedTime
        // wasteCarrierName:            job.wasteCarrierName
        // wasteCarrierRegNo:           job.wasteCarrierRegNo
        // pointOfDeposit:              job.pointOfDeposit
        // dateOfTransfer:              job.dateOfTransfer
        // vehicleRegistration:         job.vehicleRegistration
        // wasteCarrierSignature:       job.driverSignature
        // wasteCarrierNameTitle:       job.driverName
        // wasteCarrierSignedDateTime:  job.driverSignedTime
        //
        // NB: Address is built from:
        // 
        // address = job.address1;
        // address = addString(address, job.address2, ", ");
        // address = addString(address, job.address3, ", ");
        // address = addString(address, job.address4, ", ");
        // address = addString(address, job.postcode, ", ");
        job['vehicleRegistration'] = Driver.getVehicleReg();
        job['clientSignedTime'] = Helper._dates_format(job.clientSignatureStamp, CONSTANTS.DATE_TIME_FORMAT);
        job['driverSignedTime'] = Helper._dates_format(job.driverSignatureStamp, CONSTANTS.DATE_TIME_FORMAT);
        job['dateOfTransfer'] = Helper._dates_format(job.driverSignatureStamp, CONSTANTS.DATE_FORMAT);
        window.commsManager.sendMessage({
            endpoint: options.endpoint.updateJob,
            isImmediate: false,
            message: {
                job: job
            }
        });
    };
    // Send an adhoc photo with comments to the server.
    Job.uploadAdhocPhoto = function (comments, photo) {
        var job = Job.getCurrentJob();
        window.commsManager.sendMessage({
            endpoint: options.endpoint.uploadPhoto,
            isImmediate: false,
            message: {
                bookingRef: job.bookingRef,
                comments: comments,
                photo: photo.src
            }
        });
    };
    // Receive responses from the API from job update pushes.
    Job.updateJobResponse = function (responseData) {
        // Connected but failed
        if (Helper._undefinedOrNull(responseData.success) || !responseData.success) {
            AppManager.dealWithError({
                text: "There was an error updating job details - please try again."
            });
            return false;
        }
    };
    // Process job updates that have been made externally - i.e. via Portal.
    Job.jobUpdateResponse = function (response) {
        var responseData = response.data, msgId = response.id;
        // Check the driver ID.
        if (Helper._undefinedOrNull(responseData)) {
            window.logManager.log("Job.jobUpdateResponse: responseData was undefined or null.", "", "ERROR");
            return false;
        }
        if (Helper._undefinedOrNull(responseData.driverId) || Helper._undefinedOrNull(responseData.job)) {
            window.logManager.log("Job.jobUpdateResponse: driverId or job data not found.", "", "ERROR");
            return false;
        }
        // This *should* be as simple as loading up the full job and saving it into local storage...
        // For completeness, let's log the current state of the job, if it exists.
        var currentJobStatus = Job.getJobFromId(responseData.job.bookingRef);
        window.logManager.log(["Job update received. Pre-update status: ", currentJobStatus]);
        var isRemoved = Helper._booleanValue(responseData.job.isRemoved), updateMessageStatus = " was updated.", updatedJob = null;
        if (isRemoved) {
            updatedJob = { bookingRef: responseData.job.bookingRef };
        }
        else {
            updatedJob = new Job(responseData.job);
        }
        // Check for this job having been deleted - if it has, remove it from the list.
        if (isRemoved) {
            updateMessageStatus = " was removed.";
            window.logManager.log(["Job removed: " + updatedJob.bookingRef]);
            if (!Job.deleteJob(updatedJob.bookingRef)) {
                AppManager.dealWithError({
                    text: "There was an error removing job with Booking Reference " + updatedJob.bookingRef + "."
                });
                return false;
            }
        }
        else {
            // Saving at this point will update or add the job as appropriate.
            updatedJob.save();
            window.logManager.log(["Job update processed. Post-update status: ", updatedJob]);
        }
        // Re-sort the jobs to cater for date/time changes and new jobs coming in.
        JobList.sortJobs();
        // If we are on the Jobs screen, redraw. If we're currently in the updated job, redraw - notify...
        switch (window.navigationManager.getCurrentPageName()) {
            case PageConfig.Jobs.name:
                JobsPage.redrawJobs();
                break;
            case PageConfig.Job.name:
                if (isRemoved) {
                    window.navigationManager.goToPage(PageConfig.Jobs);
                }
                else {
                    // We only want to redraw if it's the same job...
                    if (window.dataManager.getItem("currentJobId") === updatedJob.bookingRef)
                        AppManager.updatePageAttribute(PageConfig.Job.tagName, "job", updatedJob);
                    break;
                }
            default:
                break;
        }
        AppManager.popup({
            titleText: "Job Update",
            messageText: "Job " + updatedJob.bookingRef + updateMessageStatus,
            type: "OK",
            actions: [function () {
                    window.commsManager.deleteMessage(msgId);
                }]
        });
    };
    // Return a job object from local storage matching the gived ID
    Job.getJobFromId = function (id) {
        var jobs = window.dataManager.getItem("jobs");
        if (Helper._undefinedNullOrEmptyArray(jobs))
            return null;
        var matching = jobs.filter(function (j) { return j.id === id; });
        if (matching.length === 0)
            return null;
        return new Job(matching[0]);
    };
    // Returns the current job.
    Job.getCurrentJob = function () {
        var jobId = window.dataManager.getItem("currentJobId");
        return Job.getJobFromId(jobId);
    };
    // Sets the current job
    Job.setCurrentJob = function (id) {
        window.dataManager.setItem("currentJobId", id);
    };
    Job.deleteJob = function (id) {
        if (Helper._undefinedNullOrEmptyString(id))
            return false;
        var jobs = window.dataManager.getItem("jobs");
        if (Helper._undefinedNullOrEmptyArray(jobs))
            return false;
        var matchingIndex = jobs.findIndex(function (j) { return j.id === id; });
        if (matchingIndex < 0)
            return false;
        // Remove the given job.
        jobs.splice(matchingIndex, 1);
        window.dataManager.setItem("jobs", jobs);
        return true;
    };
    // Gets the last known GPS coords and passes them through to a mapping site - Google initially...which on Android will offer Maps app.
    Job.getJobDirections = function () {
        var job = Job.getCurrentJob(), latitude = window.gpsManager.getLatitude(), longitude = window.gpsManager.getLongitude(), coordsStr = latitude.toString() + "," + longitude.toString();
        window.open(CONSTANTS.MAP_LINK + coordsStr + "/" + job.postcode);
    };
    // Checks if the current job has everything it needs in order to be officially set as failed.
    Job.canFail = function () {
        var job = Job.getCurrentJob(), canFail = true, checkIsComplete = true, checkFails = "", failRequirements = [];
        var COMPLETETEXT = "(complete)", INCOMPLETETEXT = "(required)";
        if (job === null)
            return false;
        // Set the job to be failing so that the signature screen directs appropriately.
        job.isFailing = true;
        job.save();
        // Job failures require a reason, some reasons may force the need for a photo as well.
        if (Helper._undefinedNullOrEmptyString(job.failureReason.reason)) {
            checkFails += "<li>Choose a failure reason</li>";
            canFail = false;
        }
        if (job.failureReason.requiresPhoto) {
            checkIsComplete = true;
            if (Helper._undefinedNullOrEmptyArray(job.failurePhotos)) {
                checkIsComplete = false;
                checkFails += "<li>Take at least one photo</li>";
            }
            if (!checkIsComplete)
                canFail = false;
        }
        // If validation has failed, popup and leave the user where they are.
        if (!canFail) {
            AppManager.popup({
                type: "OK",
                titleText: "Fail Job",
                messageText: "To confirm the job failure, please:<br/><br/><ul>" + checkFails + "</ul>",
                isHTML: true
            });
            return false;
        }
        // Check for driver signature
        if (job.requireDriverSignature) {
            // Validation checks
            checkIsComplete = true;
            if (!job.isDriverSigned())
                checkIsComplete = false;
            // Determine the event to be used now.
            var action = null;
            // If we can continue at this stage then all other requirements have been met so allow the driver sign off process to start.
            // Otherwise, alert the user that they need to tick all the other boxes.
            if (!canFail) {
                AppManager.popup({
                    type: "OK",
                    titleText: "Incomplete Requirements",
                    messageText: "Please complete other requirements first."
                });
                return false;
            }
            else {
                if (!checkIsComplete) {
                    // Display the job summary popup and let that progress through to the signature page.
                    AppManager.popup({
                        type: "OKCANCEL",
                        isHTML: true,
                        isFullScreen: true,
                        contentElement: window.printManager.print("driver"),
                        inputs: [{
                                id: "driver-name",
                                name: "driver-name",
                                label: "Driver Name",
                                type: CONSTANTS.POPUP_INPUT_TYPE.TEXT,
                                value: Driver.getName(),
                                mandatory: true
                            }, {
                                id: "driver-signature",
                                name: "driver-signature",
                                label: "Signature",
                                type: CONSTANTS.POPUP_INPUT_TYPE.SIGNATURE,
                                mandatory: true
                            }],
                        actions: [function () {
                                // Save the driver's name and signature.
                                var j = Job.getCurrentJob(), driverName = window.jQuery("#driver-name").val(), signatureBase64 = window.jQuery("#driver-signature").jSignature("getData");
                                if (Helper._undefinedNullOrEmptyString(signatureBase64)) {
                                    AppManager.dealWithError({
                                        header: "Invalid Signature",
                                        text: "Please enter a signature."
                                    });
                                    return false;
                                }
                                j.driverName = driverName;
                                j.driverSignature = signatureBase64;
                                j.driverSignatureStamp = moment();
                                j.save();
                                job = j;
                                Job.failJob();
                            },
                            "Job.goCurrentJob"]
                    });
                    return false;
                }
            }
        }
        return true;
    };
    // Check that the current job qualifies to be completed - i.e. all signatures, photos, details have been recorded.
    Job.canComplete = function () {
        var job = Job.getCurrentJob(), canContinue = true, checkIsComplete = true, completeRequirements = [];
        var COMPLETETEXT = "(complete)", INCOMPLETETEXT = "(required)";
        if (job === null)
            return false;
        job.isFailing = false;
        job.save();
        // Check for client signatures first.
        if (job.requireClientSignature) {
            // Validation checks
            checkIsComplete = true;
            if (!job.isClientSigned())
                checkIsComplete = false;
            // If we can continue at this stage then all other requirements have been met so allow the client sign off process to start.
            // Otherwise, alert the user that they need to tick all the other boxes.
            if (!canContinue) {
                AppManager.popup({
                    type: "OK",
                    titleText: "Incomplete Requirements",
                    messageText: "Please complete other requirements first."
                });
                return false;
            }
            else {
                if (!checkIsComplete) {
                    // Display the job summary popup - we need to get the customer signature.
                    AppManager.popup({
                        type: "OKCANCEL",
                        isHTML: true,
                        isFullScreen: true,
                        contentElement: window.printManager.print("customer"),
                        inputs: [{
                                id: "comments",
                                name: "comments",
                                label: "Customer Comments",
                                type: CONSTANTS.POPUP_INPUT_TYPE.TEXTAREA
                            }, {
                                id: "client-name",
                                name: "client-name",
                                label: "Customer Print Name",
                                type: CONSTANTS.POPUP_INPUT_TYPE.TEXT,
                                value: "",
                                mandatory: true
                            }, {
                                id: "client-signature",
                                name: "client-signature",
                                label: "Customer Signature",
                                type: CONSTANTS.POPUP_INPUT_TYPE.SIGNATURE,
                                mandatory: true
                            }],
                        actions: [
                            function () {
                                // Save the name and signature.
                                var j = Job.getCurrentJob(), comments = window.jQuery("#comments").val(), clientName = window.jQuery("#client-name").val(), clientSignature = window.jQuery("#client-signature").jSignature("getData"); // base64 version
                                j.comments = comments;
                                j.clientName = clientName;
                                j.clientSignature = clientSignature;
                                j.clientSignatureStamp = moment();
                                j.driverStatus = CONSTANTS.JOB_STATUS.SERVICED.identifier;
                                j.save();
                                job = j;
                                Job.goCurrentJob();
                            },
                            "Job.goCurrentJob"
                        ]
                    });
                    return false;
                }
            }
        }
        // Check for required measurement
        if (!Helper._undefinedNullOrEmptyString(job.requiredMeasurement)) {
            // Validation checks
            checkIsComplete = true;
            // If we're measuring tonnes, we need all three measurements. If it's quantity, we only need nett - which is used as a holder for the quantity.
            if (job.requiredMeasurement === CONSTANTS.MEASUREMENTS.TONNES && (Helper._undefinedNullOrNaN(job.gross) || Helper._undefinedNullOrNaN(job.tare) || Helper._undefinedNullOrNaN(job.nett)) ||
                job.requiredMeasurement === CONSTANTS.MEASUREMENTS.QUANTITY && Helper._undefinedNullOrNaN(job.nett))
                checkIsComplete = false;
            // If the check is not complete, we can't continue.
            if (!checkIsComplete) {
                // Go to the POD / measurement page
                window.navigationManager.goToPage(PageConfig.Measurements);
                return false;
            }
        }
        // Check for waste streams - we may also need to run a validation check on the streams we have here...
        if (job.requireStreams) {
            // If we require streams, check that the user has checked them.
            checkIsComplete = true;
            if (!job.hasCheckedStreams)
                checkIsComplete = false;
            // If the check is not complete, we can't continue.
            if (!checkIsComplete) {
                // Go to the breakdown / measurements page
                window.navigationManager.goToPage(PageConfig.Breakdown);
                return false;
            }
        }
        // Check for driver signature
        if (job.requireDriverSignature) {
            // Validation checks
            checkIsComplete = true;
            if (!job.isDriverSigned())
                checkIsComplete = false;
            // Determine the event to be used now.
            var action = null;
            // If we can continue at this stage then all other requirements have been met so allow the driver sign off process to start.
            // Otherwise, alert the user that they need to tick all the other boxes.
            if (!canContinue) {
                AppManager.popup({
                    type: "OK",
                    titleText: "Incomplete Requirements",
                    messageText: "Please complete other requirements first."
                });
            }
            else {
                // We only want to display the summary popup if the driver hasn't signed yet.
                if (!job.isDriverSigned()) {
                    // Display the job summary popup and let that progress through to the signature page.
                    AppManager.popup({
                        type: "OKCANCEL",
                        isHTML: true,
                        isFullScreen: true,
                        contentElement: window.printManager.print("driver"),
                        inputs: [{
                                id: "driver-name",
                                name: "driver-name",
                                label: "Driver Name",
                                type: CONSTANTS.POPUP_INPUT_TYPE.TEXT,
                                value: Driver.getName(),
                                mandatory: true
                            }, {
                                id: "driver-signature",
                                name: "driver-signature",
                                label: "Signature",
                                type: CONSTANTS.POPUP_INPUT_TYPE.SIGNATURE,
                                mandatory: true
                            }],
                        actions: [
                            function () {
                                // Save the driver's name and signature.
                                var j = Job.getCurrentJob(), driverName = window.jQuery("#driver-name").val(), driverSignature = window.jQuery("#driver-signature").jSignature("getData");
                                j.driverName = driverName;
                                // Re-grab the sig data in base64.
                                j.driverSignature = driverSignature;
                                j.driverSignatureStamp = moment();
                                j.save();
                                job = j;
                                Job.completeJob();
                            },
                            function () {
                                // If we're collecting measurements, go back there, otherwise, go current job.
                                if (job.requireStreams) {
                                    window.navigationManager.goToPage(PageConfig.Breakdown);
                                }
                                else if (!Helper._undefinedNullOrEmptyString(job.requiredMeasurement)) {
                                    window.navigationManager.goToPage(PageConfig.Measurements);
                                }
                                else {
                                    Job.goCurrentJob();
                                }
                            }
                        ]
                    });
                    return false;
                }
            }
        }
        return true;
    };
    // Update the current job instance's status
    //
    // Potential job statuses (and order):
    //   NO DRIVER NEEDED > UNASSIGNED > PENDING > ACCEPTED > INITIATED > FAILED > COMPLETE
    //
    // NB: Jobs with a status of NO DRIVER NEEDED shouldn't really be processed on a driver's device...
    //
    Job.updateStatus = function (newStatus) {
        // Get the current job from local storage and update its status
        var job = Job.getCurrentJob();
        if (job === null)
            return;
        var updatedJobData = job.setStatus(newStatus);
        // If the job has been updated then reset the job data on the page for it to be redrawn
        if (updatedJobData !== null && updatedJobData)
            AppManager.updatePageAttribute(PageConfig.Job.tagName, "job", job);
        return false;
    };
    Job.clearClientSignature = function () {
        var job = Job.getCurrentJob();
        if (job === null)
            return;
        job.clientSignature = null;
        job.save();
    };
    Job.clearDriverSignature = function () {
        var job = Job.getCurrentJob();
        if (job === null)
            return;
        job.driverSignature = null;
        job.save();
    };
    // Individual status update helpers
    Job.acceptJob = function () {
        // Mark the job as accepted if we've got everything we need.
        var job = Job.getCurrentJob();
        if (job === null)
            return false;
        // Check for ETA having been set.
        // Validation checks
        if (Helper._undefinedNullOrEmptyString(job.eta)) {
            // Build the HTML content for the popup...
            // Form container
            var containerCentered = document.createElement("div");
            containerCentered.className = "container-centered";
            // ETA input
            //...
            // Label
            var etaLabel = document.createElement("label");
            etaLabel.htmlFor = "eta";
            etaLabel.textContent = "ETA";
            containerCentered.appendChild(etaLabel);
            var etaInputs = document.createElement("div");
            etaInputs.classList.add("eta-inputs");
            // Inputs
            var hours = [];
            for (var i = 1; i <= 12; i++)
                hours.push(Helper._twoDigitTime(i));
            var etaHours_1 = document.createElement("select");
            etaHours_1.id = "eta-hours";
            // Use either the current setting or the current 12 hour value.
            var hourToCheck_1 = job.eta.substr(0, 2) !== "" ?
                job.eta.substr(0, 2) :
                (moment().hours() > 12 ?
                    moment().hours() - 12 :
                    moment().hours().toString());
            hourToCheck_1 = Helper._twoDigitTime(hourToCheck_1);
            hours.forEach(function (opt) {
                var inputOption = document.createElement("option");
                inputOption.value = opt;
                inputOption.text = opt;
                if (opt === hourToCheck_1)
                    inputOption.selected = true;
                etaHours_1.add(inputOption);
            });
            etaInputs.appendChild(etaHours_1);
            var mins = [];
            for (var i = 0; i <= 59; i += 15)
                mins.push(Helper._twoDigitTime(i));
            var etaMins_1 = document.createElement("select");
            etaMins_1.id = "eta-mins";
            // Use either the current setting or the current value.
            var minToCheck_1 = job.eta.substr(3, 2) !== "" ? job.eta.substr(3, 2) : Helper._twoDigitTime(Helper._closestValue(mins, moment().minutes()));
            mins.forEach(function (opt) {
                var inputOption = document.createElement("option");
                inputOption.value = opt.toLowerCase();
                inputOption.text = opt;
                if (opt === minToCheck_1)
                    inputOption.selected = true;
                etaMins_1.add(inputOption);
            });
            etaInputs.appendChild(etaMins_1);
            var ampm = ["AM", "PM"];
            var etaampm_1 = document.createElement("select");
            etaampm_1.id = "eta-ampm";
            // Use either the current setting or the current value.
            var amPmToCheck_1 = job.eta.substr(5, 2) !== "" ? job.eta.substr(5, 2) : moment().hours() < 12 ? "AM" : "PM";
            ampm.forEach(function (opt) {
                var inputOption = document.createElement("option");
                inputOption.value = opt.toLowerCase();
                inputOption.text = opt;
                if (opt === amPmToCheck_1)
                    inputOption.selected = true;
                etaampm_1.add(inputOption);
            });
            etaInputs.appendChild(etaampm_1);
            containerCentered.appendChild(etaInputs);
            AppManager.popup({
                type: "SUBMITCANCEL",
                titleText: "Set ETA",
                messageText: "Please enter your estimated time of arrival",
                isHTML: true,
                contentElement: containerCentered,
                actions: [function () {
                        // Fetch the latest copy of the current job in case service amendments (or some other update) has been made.
                        var j = Job.getCurrentJob();
                        j.eta = j.formatEta(window.jQuery("#eta-hours").val(), window.jQuery("#eta-mins").val(), window.jQuery("#eta-ampm").val());
                        ;
                        j.save();
                        // updateStatus will reset the job data on the page so the updates will be redrawn automatically.
                        Job.updateStatus(CONSTANTS.JOB_STATUS.ACCEPTED.identifier);
                        // Send job updates through the API.
                        Job.pushJobUpdates();
                    }]
            });
        }
        else {
            // updateStatus will reset the job data on the page so the updates will be redrawn automatically.
            Job.updateStatus(CONSTANTS.JOB_STATUS.ACCEPTED.identifier);
            // Send job updates through the API.
            Job.pushJobUpdates();
        }
    };
    // Allow the user to reject a job - after confirming.
    Job.rejectJob = function () {
        AppManager.popup({
            type: "OKCANCEL",
            titleText: "Reject Job",
            messageText: "Are you sure you want to reject this job?",
            actions: [function () {
                    Job.updateStatus(CONSTANTS.JOB_STATUS.UNASSIGNED.identifier);
                    // Send job updates through the API.
                    Job.pushJobUpdates();
                    // Go to the jobs page
                    window.navigationManager.goToPage(PageConfig.Jobs);
                }]
        });
    };
    Job.startJob = function () {
        // When starting a job, the driver can optionally set the ETA.
        Job.updateStatus(CONSTANTS.JOB_STATUS.INITIATED.identifier);
        // Send job updates through the API.
        Job.pushJobUpdates();
    };
    Job.goFailJob = function () {
        window.navigationManager.goToPage(PageConfig.Fail);
    };
    Job.failJob = function () {
        // Mark the job as failed if we've got everything we need, otherwise, canFail will divert the user accordingly.
        if (Job.canFail()) {
            Job.updateStatus(CONSTANTS.JOB_STATUS.FAILED.identifier);
            // Send job updates through the API.
            Job.pushJobUpdates();
            // Go to the jobs page
            window.navigationManager.goToPage(PageConfig.Jobs);
        }
    };
    Job.completeJob = function () {
        // Not sure on the exact process for this yet so will leave the path as free and easy as possible - i.e. we need client sig, driver sig, measurement docket, stream breakdowns.
        // Collect them in any order and allow complete when they're all done.
        // Should then be able to switch the order around at will.
        //
        // By using the 'canComplete' function here, I'm going to let that divert the user to the relevant page and then keep calling the function until all criteria has been met.
        // We can only complete the job if we have everything we need.
        if (Job.canComplete()) {
            Job.updateStatus(CONSTANTS.JOB_STATUS.COMPLETE.identifier);
            // The job is now complete so combine everything that goes together to produce the notes.
            var job = Job.getCurrentJob();
            // Add service amendments
            if (!Helper._undefinedNullOrEmptyString(job.serviceAmendments)) {
                job.notes += "Service Amendments: " + job.serviceAmendments;
            }
            // Add customer comments
            if (!Helper._undefinedNullOrEmptyString(job.serviceAmendments)) {
                job.notes += "Customer Comments: " + job.comments;
            }
            // Send job updates through the API.
            Job.pushJobUpdates();
            // If the job has completed, display the simulated PDF of the job details as confirmation.
            AppManager.popup({
                type: "OK",
                isHTML: true,
                isFullScreen: true,
                contentElement: window.printManager.print("driver"),
                actions: [function () {
                        // Go to the jobs page
                        window.navigationManager.goToPage(PageConfig.Jobs);
                    }]
            });
        }
    };
    // Resets the current job - reverting anything that could have been edited by the user.
    Job.restartJob = function () {
        Job.updateStatus(CONSTANTS.JOB_STATUS.ACCEPTED.identifier);
        // Clear down existing measurements.
        var job = Job.getCurrentJob();
        job.reset();
    };
    // Navigation functions
    // Open the current job page
    Job.goCurrentJob = function () {
        window.navigationManager.goToPage(PageConfig.Job);
        return false;
    };
    Job.test = function () {
        window.location.href = "http://cubiq.org/dropbox/iscroll4/examples/pull-to-refresh/";
    };
    return Job;
}());
var JobList = /** @class */ (function () {
    function JobList() {
    }
    JobList.sortJobs = function () {
        var jobs = window.dataManager.getItem("jobs");
        jobs.sort(function (a, b) {
            // Compare dates first.
            var aDate = moment(a.date, CONSTANTS.INCOMING_DATE_FORMAT), bDate = moment(b.date, CONSTANTS.INCOMING_DATE_FORMAT);
            if (aDate > bDate)
                return 1;
            if (aDate < bDate)
                return -1;
            // We need to compare based on the first time associated with the job. This could be either the start time or the end time,
            // so we'll grab the relevant time first and then run the comparison.
            var aComparator = 24, bComparator = 24;
            // If we've got a startHour, use it, otherwise, if we've got an endHour use that. Failing that, it will default to 24 - i.e. will
            // be guaranteed to be at the bottom of the list.
            if (!Helper._undefinedNullOrNaN(a.startHour)) {
                aComparator = Number(a.startHour);
            }
            else if (!Helper._undefinedNullOrNaN(a.endHour)) {
                aComparator = Number(a.endHour);
            }
            // Same for b...
            if (!Helper._undefinedNullOrNaN(b.startHour)) {
                bComparator = Number(b.startHour);
            }
            else if (!Helper._undefinedNullOrNaN(b.endHour)) {
                bComparator = Number(b.endHour);
            }
            if (aComparator > bComparator)
                return 1;
            if (aComparator < bComparator)
                return -1;
            // Finally (unless we start sorting on ETA times...) return based on the postcode for the sake of argument.
            if (a.postcode > b.postcode)
                return 1;
            if (a.postcode < b.postcode)
                return -1;
            return 0;
        });
        // Save the sorted job list.
        window.dataManager.setItem("jobs", jobs);
    };
    return JobList;
}());
var Login = /** @class */ (function () {
    function Login() {
    }
    // Run a login request.
    Login.login = function () {
        var username = document.getElementById("username").value, password = document.getElementById("password").value;
        if (username === "" || password === "") {
            AppManager.dealWithError({ text: "Please enter your user name and password to login." });
            return false;
        }
        // Save the driver email now.
        var driver = Driver.getDriver();
        driver.email = username;
        driver.save();
        var msg = { "email": username, "password": password };
        window.commsManager.sendMessage({
            endpoint: options.endpoint.login,
            isImmediate: true,
            message: msg,
            callback: {
                success: Login.loginResponse,
                error: null
            }
        });
    };
    // Receive a login response and deal with the response.
    Login.loginResponse = function (responseData) {
        // Connected but login failed
        if (Helper._undefinedOrNull(responseData.success) || !responseData.success) {
            AppManager.dealWithError({
                text: "The user name or password you used was incorrect. Please try again."
            });
            return false;
        }
        // Connected and login succeeded:
        var message = responseData.message;
        // Get the driver's token from the returned data and request their jobs.
        if (Helper._undefinedNullOrEmptyString(message.token)) {
            AppManager.dealWithError({
                text: "There was an error logging in. Please try again later."
            });
            return false;
        }
        // Add the newly retrieved driver details.
        var driver = Driver.getDriver();
        driver.token = message.token.toString();
        driver.save();
        // A successful login will also return various items of application static data (so these can be controlled at server level if need be).
        if (!Helper._undefinedOrNull(message.staticData)) {
            var staticData = message.staticData;
            // staticData is expected to be a regular JSON object.
            // Loop through all the staticData properties, replacing the relevant options value if need be.
            if (!Helper._undefinedOrNull(staticData)) {
                for (var p in staticData) {
                    if (staticData.hasOwnProperty(p)) {
                        // Check options values.
                        if (!Helper._undefinedNullOrEmptyString(options[p]))
                            options[p] = staticData[p];
                        // Check 'constants' values.
                        if (!Helper._undefinedNullOrEmptyString(CONSTANTS[p]))
                            CONSTANTS[p] = staticData[p];
                    }
                }
            }
        }
        // Navigate to the main jobs page and wait for the data
        window.navigationManager.goToPage(PageConfig.Jobs, true);
    };
    return Login;
}());
// Extend with static properties as needed
// for every page you wish to create within
// your application
var PageConfig = /** @class */ (function () {
    function PageConfig() {
    }
    PageConfig.Login = {
        name: "Login",
        tagName: "login-page",
        barText: undefined,
        isDark: true
    };
    PageConfig.Jobs = {
        name: "Jobs",
        tagName: "jobs-page",
        barText: "Jobs",
        header: {
            buttons: [{
                    iconName: "iconLogout",
                    buttonText: "Logout",
                    event: "ButtonBarButtonActions.logout"
                }, {
                    iconName: "iconRefresh",
                    buttonText: "",
                    event: "Driver.getJobs"
                }]
        }
    };
    PageConfig.Job = {
        name: "Job",
        tagName: "job-page",
        barText: "Job Details",
        header: {
            buttons: [{
                    iconName: "iconBack",
                    buttonText: "",
                    event: "ButtonBarButtonActions.jobs"
                }]
        },
        footer: {
            type: "even-split",
            buttons: []
        }
    };
    PageConfig.Measurements = {
        name: "Measurements",
        tagName: "measurements-page",
        barText: "Measurements",
        header: {
            buttons: [{
                    iconName: "iconBack",
                    buttonText: "",
                    event: "MeasurementsPage.back"
                }]
        },
        footer: {
            buttons: [{
                    buttonText: "Back",
                    event: "MeasurementsPage.back",
                    isBack: true
                }, {
                    buttonText: "Confirm",
                    event: "MeasurementsPage.submit",
                    isPositive: true
                }]
        }
    };
    PageConfig.Breakdown = {
        name: "Breakdown",
        tagName: "breakdown-page",
        barText: "Waste Stream Breakdown",
        header: {
            buttons: [{
                    iconName: "iconBack",
                    buttonText: "",
                    event: "BreakdownPage.back"
                }]
        },
        footer: {
            type: "even-split",
            buttons: [{
                    iconName: "",
                    buttonText: "Back",
                    event: "BreakdownPage.back",
                    isBack: true
                }, {
                    iconName: "",
                    buttonText: "Confirm",
                    event: "BreakdownPage.breakdownSubmit",
                    isPositive: true
                }]
        }
    };
    PageConfig.Fail = {
        name: "Fail",
        tagName: "fail-page",
        barText: "Fail Job",
        header: {
            buttons: [{
                    iconName: "iconBack",
                    buttonText: "",
                    event: "Job.goCurrentJob"
                }]
        },
        footer: {
            buttons: [{
                    buttonText: "Cancel",
                    event: "Job.goCurrentJob",
                    isBack: true
                }, {
                    buttonText: "Confirm",
                    event: "FailPage.submit",
                    isPositive: true
                }]
        }
    };
    return PageConfig;
}());
// This is the App Launcher which starts the
// web components for the app.
// It will remove the default mDesign HTML that
// we don't need to display and get the app
// ready for operation.
// This could (and probably should) be extended
// so that we can choose the type of page to load.
// We could then use this in the case of application
// crashes and resume where we left off.
var AppLauncher = /** @class */ (function (_super) {
    __extends(AppLauncher, _super);
    function AppLauncher() {
        return _super.call(this) || this;
    }
    AppLauncher.prototype.createdCallback = function () {
        debugger;
        // Reset and remove standard mDesign elements
        window.jmfw('.jmuiLayout').remove();
        // Check if we have saved state, if so, start there! Otherwise, continue to use the initial page as normal.
        var startPage = window.stateManager.restoreState();
        if (startPage === "")
            startPage = options.initialPage;
        var startPageEl = document.createElement(PageConfig[startPage].tagName);
        startPageEl.classList.add("md-page");
        startPageEl.setAttribute('pageName', startPage);
        document.body.appendChild(startPageEl);
    };
    AppLauncher.prototype.attachedCallback = function () {
        debugger;
        // Disable the physical back button...
        document.addEventListener('deviceready', function () {
            window.logManager.log("Device is ready, disabling back button");
            document.addEventListener('backbutton', function (e) {
                window.logManager.log("Back button clicked");
                e.preventDefault();
                return false;
            }, false);
        }, false);
        window.jmfw(this).remove();
        // Looks like the shell is calling scollToElement when returning to the app, we don't use that system so out it goes.
        if (!Helper._undefinedOrNull(window["scrollToElement"])) {
            window["scrollToElement"] = function (el) {
                return false;
            };
        }
    };
    return AppLauncher;
}(HTMLElement));
// Our options object.
// Making changes here will affect how the application works.
var ctEndpointURL = "https://reconomy-epod-development.azurewebsites.net/api/", 
// Silktide endpoint details
externalEndpointURL = "http://portal.reconomy.com/api/";
// endpointLogin = { base: options.endpointURL, url: "driver/login", method: "POST" };
// endpointAllData = { base: options.endpointURL, url: "driver/me", method: "GET" };
// endpointUpdateJob = { base: options.endpointURL, url: "job/set", method: "POST" };
var options = {
    headerText: "ePOD",
    appTag: "Electronic Proof Of Delivery",
    subHeaderText: "",
    copyrightText: "Copyright Reconomy Ltd " + moment().year(),
    version: "v0.1.16",
    internalVersion: 'v0.1.1601',
    localStorage: true,
    debug: true,
    comms: "ZUMO",
    // Route everything through the CT-controlled mobile service.
    endpoint: {
        sendMail: { type: "sendMail", base: ctEndpointURL, url: "sendmail", method: "ZUMO" },
        login: { type: "login", base: ctEndpointURL, url: "driverLogin", method: "ZUMO" },
        allData: { type: "allData", base: ctEndpointURL, url: "driverGetData", method: "ZUMO" },
        updateJob: { type: "updateJob", base: ctEndpointURL, url: "updateJob", method: "ZUMO" },
        uploadPhoto: { type: "uploadPhoto", base: ctEndpointURL, url: "uploadphoto", method: "ZUMO" }
    },
    defaultTtl: 10000,
    initialPage: "Login",
    defaultOrientation: "PORTRAIT",
    currentOrientation: "",
    hiddenMenuClickLimit: 10
};
// Constants object
var CONSTANTS = {
    MAIN_TELEPHONE: "0845 123 456",
    MAP_LINK: "https://www.google.com/maps/dir/",
    INCOMING_DATE_FORMAT: "DD/MM/YYYY",
    DATE_FORMAT: "DD/MM/YYYY",
    DATE_TIME_FORMAT: "DD/MM/YYYY HH:mm:ss",
    CUSTOMER_STATUTORY_TEXT: "I confirm that: I have fulfilled my duty to apply the waste hierarchy as required by Regulation 12 of the Waste (England and Wales) Regulations 2011.",
    DRIVER_STATUTORY_TEXT: "NB: Measurements / Waste Stream Breakdowns cannot be edited once signed off.",
    FAILURE_STATUTORY_TEXT: "Job cannot be edited once signed off as failed.",
    // Job statuses
    JOB_STATUS: {
        NO_DRIVER: {
            identifier: " ",
            text: "No Driver Needed"
        },
        UNASSIGNED: {
            identifier: "U",
            text: "Unassigned"
        },
        PENDING: {
            identifier: "P",
            text: "Pending"
        },
        ACCEPTED: {
            identifier: "A",
            text: "Accepted"
        },
        INITIATED: {
            identifier: "I",
            text: "Started"
        },
        FAILED: {
            identifier: "F",
            text: "Failed"
        },
        COMPLETE: {
            identifier: "C",
            text: "Complete"
        },
        SERVICED: {
            identifier: "S",
            text: "Serviced"
        }
    },
    // Failure page
    FAIL: {
        MAX_FAIL_PHOTOS: 1,
        FAILURE_REASONS: [{
                reason: "Road blocked",
                requiresPhoto: true
            }, {
                reason: "Taken ill",
                requiresPhoto: false
            }, {
                reason: "Flat tyre",
                requiresPhoto: true
            }]
    },
    // Measurements page
    MEASUREMENTS: {
        TONNES: "tonnes",
        QUANTITY: "quantity",
        MAX_PHOTOS: 1,
        MAX_GROSS_TONNAGE: 42,
        MAX_NETT_TONNAGE: 36
    },
    // Popup inpput types
    POPUP_INPUT_TYPE: {
        TEXT: "text",
        NUMBER: "number",
        EMAIL: "email",
        TEXTAREA: "textarea",
        SELECT: "select",
        SIGNATURE: "signature"
    },
    MAX_SPECIAL_INSTRUCTIONS: 6,
    REGEX: {
        DECIMAL_POINTS: "^\\d{1,14}(\\.\\d{1,2})?$",
        VALID_POSTCODE: "[A-Z]{1,2}[0-9][0-9A-Z]?\\s?[0-9][A-Z]{2}",
        SPACES: "\\s",
        FLAGS: {
            GLOBAL: "g",
            CASE_INSENSITVE: "i",
            NO_FLAGS: ""
        }
    },
};
// Set up the job statuses for easy access - in the form CONSTANTS.JOB_STATUS.A, for example
for (var status in CONSTANTS.JOB_STATUS) {
    if (CONSTANTS.JOB_STATUS[status].hasOwnProperty("identifier") && CONSTANTS.JOB_STATUS[status].identifier !== "") {
        CONSTANTS.JOB_STATUS[CONSTANTS.JOB_STATUS[status].identifier] = CONSTANTS.JOB_STATUS[status];
    }
}
// App Manager class
// Used for general application management
var AppManager = /** @class */ (function () {
    function AppManager(options) {
        this.updateOptions(options);
    }
    // Can be called outside of the constructor
    // so that we can overwrite app options at
    // any time during the object lifespan.
    AppManager.prototype.updateOptions = function (options) {
        this.localStorage = options.localStorage;
        this.version = options.version;
    };
    AppManager.showHiddenMenu = function () {
        AppManager.popup({
            type: 'OK',
            isHTML: true,
            isFullScreen: true,
            contentElement: window.printManager.printHiddenMenu()
        });
    };
    // Update an attribute on a page
    AppManager.updatePageAttribute = function (pageTag, attributeName, value) {
        var page = document.getElementsByTagName(pageTag);
        if (page[0] !== undefined) {
            page[0].setAttribute(attributeName, JSON.stringify(value));
            return true;
        }
        else {
            window.logManager.log("Could not find page...", "", "ERROR");
        }
        return false;
    };
    AppManager.dealWithError = function (errorObject, actions) {
        window.logManager.log(errorObject, "", "ERROR");
        AppManager.popup({
            titleText: errorObject.header || "Error",
            messageText: errorObject.text || "There was an error, please try again.",
            type: "OK",
            actions: actions
        });
    };
    // Output a standard popup box with n options on the standard 'inner' container
    AppManager.popup = function (p) {
        var popup = document.createElement("pop-up");
        popup.titleText = p.titleText;
        popup.messageText = p.messageText;
        popup.contentElement = p.contentElement;
        popup.type = p.type;
        popup.options = p.options;
        popup.inputs = p.inputs;
        popup.actions = p.actions;
        popup.isHTML = p.isHTML;
        popup.isFullScreen = p.isFullScreen;
        popup.order = p.order;
        popup.validation = p.validation;
        var innerBody = document.getElementsByClassName("inner");
        innerBody[0].appendChild(popup);
    };
    // Function could be stored like "ClassName.method", where we'll need to parse that into something we can actually use. This allows us to set up class methods before they have been declared. Sounds dodgy to me.
    // However, it could also be a function so we'll check for that first. Flexible. Confusing.
    AppManager.executeFunction = function (f) {
        if (typeof f === "function") {
            return f();
        }
        else if (typeof f === "string" && f !== "") {
            return AppManager.executeFunctionByName(f, window);
        }
    };
    // Allows functions to be stored like "Namespace.ClassName.Method" in text format and be returned and run as the actual function.
    AppManager.executeFunctionByName = function (functionName, context) {
        var args = [].slice.call(arguments).splice(2), namespaces = functionName.split("."), func = namespaces.pop();
        for (var i = 0; i < namespaces.length; i++)
            context = context[namespaces[i]];
        if (Helper._undefinedOrNull(context[func])) {
            window.logManager.log("Function " + func + " does not exist in context " + functionName, "", "ERROR");
            return false;
        }
        return context[func].apply(context, args);
    };
    // Resets the application to a state ready for a new user to login (i.e. this is run on logout).
    AppManager.reset = function () {
        var itemsToClear = [
            "state",
            "jobs",
            "driver",
            "lastPhoto",
            "currentJobId"
        ];
        itemsToClear.forEach(function (item) {
            window.dataManager.deleteItem(item);
        });
        // If we've set up listening for this driver, remove the channel now.
        window.commsManager.pushListenerRemoveChannel(window.commsManager.pushListenerChannel);
    };
    AppManager.registerElements = function () {
        var elementsToRegsiter = [{
                tag: "app-launcher",
                element: AppLauncher
            }];
        elementsToRegsiter.forEach(function (el) {
            document.registerElement(el.tag, el.element);
        });
    };
    return AppManager;
}());
// Initialise AppManager
window.appManager = new AppManager(options);
var CameraManager = /** @class */ (function () {
    function CameraManager() {
    }
    // We have to generate the options as part of the
    // class because if we do it earlier, the hardware
    // hasn't initialised and some of the options aren't
    // set correctly. Therefore, we call this function
    // later in the app when the hardware is ready
    CameraManager.prototype.generateOptions = function () {
        this.options = {
            quality: 80,
            targetWidth: 1024,
            targetHeight: 768,
            allowEdit: false,
            sourceType: navigator.camera.PictureSourceType.CAMERA,
            correctOrientation: true,
            destinationType: navigator.camera.DestinationType.FILE_URI
        };
    };
    CameraManager.prototype.cameraSuccess = function (fileUri) {
        var _this = this;
        if (Helper._undefinedNullOrEmptyString(fileUri))
            return;
        CommsManager.showLoader(true);
        this.lastCameraStatus = true;
        var subjectGuid = window.mCapture.db.getCurrentSubjectGuid(), newPhotoGuid = window.mCapture.db.guid();
        this.currentPhoto = {
            id: newPhotoGuid,
            latitude: window.gpsManager.getLatitude(),
            longitude: window.gpsManager.getLongitude(),
            timeStamp: Helper._dates_getISOString()
        };
        window.mCapture.fs.moveTemporaryFile(fileUri, subjectGuid, newPhotoGuid, function (e) { return _this.fileMovedSuccess(e); }, this.fileMovedFail);
    };
    // The onSuccess callback should close the activity loader.
    CameraManager.prototype.fileMovedSuccess = function (fileUri) {
        window.dataManager.setItem("lastPhoto", this.currentPhoto);
        // If we've got a callback - call it! Back.
        if (this.onSuccess !== undefined)
            this.onSuccess(this.currentPhoto);
    };
    CameraManager.prototype.fileMovedFail = function (ex) {
        CommsManager.showLoader(false);
        window.logManager.log(["Camera Error:", ex]);
    };
    CameraManager.prototype.cameraFail = function (ex) {
        this.lastCameraStatus = false;
        window.logManager.log(["Camera Error:", ex]);
    };
    CameraManager.prototype.getPhoto = function (photo, returnFn) {
        var subjectGuid = window.mCapture.db.getCurrentSubjectGuid();
        window.mCapture.fs.getAttachmentData(subjectGuid, photo.id, function (res) {
            res = res.replace("null", "image/jpeg");
            photo.src = res;
            return returnFn(photo);
        }, function (e) {
            window.logManager.log(e);
        });
    };
    CameraManager.prototype.goCamera = function (type, callback) {
        var _this = this;
        this.onSuccess = callback;
        if (this.options === undefined)
            this.generateOptions();
        switch (type) {
            case "camera":
                this.options.sourceType = navigator.camera.PictureSourceType.CAMERA;
                break;
            case "library":
                this.options.sourceType = navigator.camera.PictureSourceType.PHOTOLIBRARY;
                break;
            default:
                break;
        }
        navigator.camera.getPicture((function (e) { return _this.cameraSuccess(e); }), (function (e) { return _this.cameraFail(e); }), this.options);
    };
    CameraManager.prototype.startCamera = function (callback) {
        this.goCamera("camera", callback);
    };
    CameraManager.prototype.startPhotoLibrary = function (callback) {
        this.goCamera("library", callback);
    };
    return CameraManager;
}());
window.cameraManager = new CameraManager();
var CommsManager = /** @class */ (function () {
    function CommsManager(type) {
        this.commsType = type;
        this.pushListenerActive = false;
    }
    // Make a new telephone call to the main telephone number.
    CommsManager.prototype.mainTelephoneCall = function () {
        window.commsManager.phoneCall(CONSTANTS.MAIN_TELEPHONE);
    };
    // Make a new telephone call.
    CommsManager.prototype.phoneCall = function (telNo) {
        if (Helper._undefinedNullOrEmptyString(telNo))
            return;
        window.mCapture.fl.makephonecall(telNo);
    };
    CommsManager.prototype.sendMessage = function (commsMessage) {
        // We need an endpoint to send to.
        if (Helper._undefinedNullOrEmptyString(commsMessage.endpoint.url)) {
            window.logManager.log("Endpoint URL was not set in app options.", "", "ERROR");
            return false;
        }
        if (Helper._undefinedOrNull(commsMessage.isImmediate))
            commsMessage.isImmediate = false;
        // Make sure that we can connect (if we need to). If we don't need to, we might be able to queue the message in the outbox.
        if (commsMessage.isImmediate && !window.commsManager.canConnect()) {
            CommsManager.showLoader(false);
            AppManager.dealWithError({
                header: "Connection",
                text: "No connection is available - please try again when you have an internet connection."
            });
            return false;
        }
        // Update the endpoint string - ensuring there is a trailing slash on the endpointURL setting
        var endpoint = !Helper._undefinedNullOrEmptyString(commsMessage.endpoint.base) ? Helper._regexReplace(commsMessage.endpoint.base, '\/?$', '/', CONSTANTS.REGEX.FLAGS.NO_FLAGS) : "";
        endpoint += commsMessage.endpoint.url;
        if (commsMessage.ttl === undefined)
            commsMessage.ttl = options.defaultTtl;
        // Only show the loader if we haven't been told not to
        if (commsMessage.hideLoader === undefined || !commsMessage.hideLoader)
            CommsManager.showLoader();
        // Add a unique ID for tracking messages through the queue.
        commsMessage.message["msgId"] = Helper._uuid();
        // Add the message type
        commsMessage.message["msgType"] = commsMessage.endpoint.type;
        // Add the app version number to all requests for debugging.
        commsMessage.message["appVersion"] = options.version;
        // Include the current driver tokem.
        commsMessage.message["token"] = Driver.getToken();
        // Set the time this message was created.
        commsMessage.message["timestamp"] = Helper._dates_getUnixTimestamp();
        // Include the coords here - the server will use these unless there are additional coords in the job detail - i.e. for photos, etc.
        commsMessage.message["latitude"] = window.gpsManager.getLatitude();
        commsMessage.message["longitude"] = window.gpsManager.getLongitude();
        //******************************************************************************************************************
        // Dummy requests for testing before the API is live
        //******************************************************************************************************************
        var testing = false;
        if (testing) {
            window.logManager.log("TESTING MODE!");
            var processed = false;
            if (commsMessage.endpoint.url === options.endpoint.login.url) {
                // Allow live transactions to process for a single test email account.
                if (commsMessage.message["email"] !== "grahamstone@reconomy.com") {
                    processed = true;
                    var response = {
                        type: "login",
                        success: true,
                        message: {
                            token: "h478fh43fh234u9fh4239fh34789h"
                        }
                    };
                    window.commsManager.runCallBackFunction("success", commsMessage.callback, response);
                }
            }
            if (commsMessage.endpoint.url === options.endpoint.allData.url) {
                if (Driver.getEmail() !== "grahamstone@reconomy.com") {
                    processed = true;
                    var response = {
                        type: "alldata",
                        success: true,
                        message: {}
                    };
                    response.message = JSON.stringify({
                        driverId: "12345",
                        name: "Steve Smith",
                        vehicleReg: "H12 3HH",
                        jobs: [{
                                "bookingRef": "6526285",
                                "date": "29/06/2016",
                                "startHour": null,
                                "endHour": 17,
                                "unit": "tonnes",
                                "service": "Price difference",
                                "movementCode": "PI",
                                "movementDesc": "8yd Skip-Light Mixed Waste (Const)",
                                "companyName": "Balfour Beatty",
                                "contractName": "(LO) Electricity Alliance",
                                "sicCode": "SIC Code",
                                "ewcCode": "EWC Code",
                                "disposalSite": "Disposal Site A",
                                "siteContactName": "Mr Site Contact",
                                "address1": "NG Littlebrook Substation",
                                "address2": "Littlebrook Manor Parkway",
                                "address3": "Dartford",
                                "address4": "Kent",
                                "postcode": "DA1 5PZ",
                                "specialInstructions1": "Special Instruction 1",
                                "specialInstructions2": "Special Instruction 2",
                                "specialInstructions3": "",
                                "specialInstructions4": "",
                                "specialInstructions5": "",
                                "specialInstructions6": "",
                                "streams": [
                                    {
                                        "name": "Wood",
                                        "streamId": 193689,
                                        "defaultPercentage": 16
                                    },
                                    {
                                        "name": "Plastic",
                                        "streamId": 193690,
                                        "defaultPercentage": 5
                                    },
                                    {
                                        "name": "Aggregates",
                                        "streamId": 193691,
                                        "defaultPercentage": 38
                                    },
                                    {
                                        "name": "Metal",
                                        "streamId": 193692,
                                        "defaultPercentage": 10
                                    },
                                    {
                                        "name": "Green waste",
                                        "streamId": 193693,
                                        "defaultPercentage": 5
                                    },
                                    {
                                        "name": "Packaging",
                                        "streamId": 193694,
                                        "defaultPercentage": 12
                                    },
                                    {
                                        "name": "Paper/card",
                                        "streamId": 193695,
                                        "defaultPercentage": 4
                                    },
                                    {
                                        "name": "Glass",
                                        "streamId": 193696,
                                        "defaultPercentage": 5
                                    },
                                    {
                                        "name": "Soils",
                                        "streamId": 193697,
                                        "defaultPercentage": 8
                                    },
                                    {
                                        "name": "Gypsum based wastes",
                                        "streamId": 193698,
                                        "defaultPercentage": 0
                                    },
                                    {
                                        "name": "Food Waste",
                                        "streamId": 231815,
                                        "defaultPercentage": 0
                                    },
                                    {
                                        "name": "Other",
                                        "streamId": 193699,
                                        "defaultPercentage": 0
                                    }
                                ],
                                "driverStatus": "A",
                                "driverEtaDate": null,
                                "driverEtaHour": null
                            },
                            {
                                "driverStatus": "C",
                                "bookingRef": "booking-ref-9",
                                "date": "29/06/2016",
                                "startHour": "7",
                                "endHour": null,
                                "service": "Delivery",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "contractName": "Mr A. Gardener",
                                "disposalSite": "Disposal Site A",
                                "address1": "21 Juniper Place",
                                "postcode": "HG7 4DB",
                                "specialInstructions1": "Large back gate will be open",
                                "driverEtaDate": "29/06/2016",
                                "driverEtaHour": 8,
                                "unit": "tonnes",
                                "streams": [
                                    {
                                        "streamId": 123,
                                        "name": "Wood",
                                        "defaultPercentage": 20
                                    },
                                    {
                                        "streamId": 124,
                                        "name": "Metal",
                                        "defaultPercentage": 40
                                    },
                                    {
                                        "streamId": 125,
                                        "name": "Plastic",
                                        "defaultPercentage": 40
                                    }
                                ]
                            }, {
                                "driverStatus": "F",
                                "bookingRef": "booking-ref-14",
                                "date": "29/06/2016",
                                "startHour": "7",
                                "endHour": null,
                                "service": "Delivery",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "disposalSite": "Disposal Site A",
                                "unit": "Quantity",
                                "contractName": "Mr A. Gardener",
                                "address1": "16 Sarmad Lane",
                                "postcode": "RE5 9DL",
                                "specialInstructions1": "Large back gate will be open",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                            }, {
                                "driverStatus": "S",
                                "bookingRef": "booking-ref-1",
                                "date": "29/06/2016",
                                "startHour": "8",
                                "endHour": null,
                                "service": "Collection",
                                "movementCode": "M1",
                                "movementDesc": "Collect small skip",
                                "disposalSite": "Disposal Site A",
                                "contractName": "Bill Bragg",
                                "address1": "2 High St",
                                "postcode": "AA1 1AA",
                                "specialInstructions1": "Call ahead on 07979797979",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes",
                                "clientName": "Mr Customer",
                                "clientSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATIAAABNCAYAAAAlxehlAAAR/UlEQVR4Xu1dbYwkRRmumt29AzRwGmIwiuwPf8EpeLd78gPCaXKJXwkgJiohN8Md/EIjChElJpy//ED0zkSiicos6vFHYTfqH40yJ7kgtwfukTOokbgXokaDCidf7keXz1tv13T3TM9sz3T3THfPW8nAzWx3ddVTVU/X+1laSREEBAFBoOQI6JK3X5ovCAgCgoASIpNJIAgIAqVHQIis9EMoHRAEBAEhMpkDgoAgUHoEhMhKP4TSAUFAEBAikzkgCAgCpUdAiKz0QygdEAQEASEymQOCgCBQegSEyEo/hNIBQUAQECKTOSAICAKlR0CIrPRDKB0QBAQBITKZA4KAIFB6BITISj+E0gFBQBAQIpM5IAgIAqVHQIis9EMoHRAEBAEhMpkDgoAgUHoEhMhKP4TSAUFAEBAikzkgCAgCpUdAiKz0QygdEAQEASEymQOCgCBQegSEyIowhJfvv0ptqrPq9INPj7Q5u266Wump81Wt9pJ9rjZ7Ez/fqBdww4q93vNer8zmWfXUDx9LfL9cKAhkiIAQWYZgDl3VfN0ojaEw6qhaV7eplSZIImWZb1wBorkApzLMouJZ1L0DNeI3IiwVEJZJ8Zzw7KF6+PsqnrWK/6+gTyvKmFNqucmEJ0UQyAkBIbKcgE1c7Z76q1j451gWoNGgnY5Wh9WaOpKI0IiwjL5E1QyRFP4N4tI+YYVJiusOSvh72llg6zWb6MCU3wd+TpToWvjeUhvqb2rNe2Lku8/EAyIXlhGBtFO4jH0uVpvn62vYuczYRgW7mm5C27n/nWq7vlhN6TlLVkRaRFiOnIYhpuB5pyyBDlK03eFdvuUtRr2Ga0DUfnHt1Hbn1lLGW1WbpqV+94NjW9YlF2DUG7NqylymXlk/rZ45ekYg6X5nCibjQGCusReE9GhkB+MWP79mXsOC93DNeW2iC5NX/zY7glrF/auohciKxbyTzVam3aV+1NriK+8Olbqk6xme/YX6U2v3mfqz3JSXaidYRFrb9DUQzxlPUgm0x95sqBML/AKUIudaFmIOzO//kdK1G7G8WRxzSzput0UNjopsL/rkRAQFnRQIK2uSGhakKxo71DQWYM0uQHzM1aqmmcBcYbH0X2p54cJhH1OZ+3jXvQ8Y7USfrsOHdr1RrNpjb1aA2bsq0/eUHZG3YEoAh7qd3rQz6lr/DUuLfEebwDr1WHad+0+h0fLU//Df36pN70Flag8n0qMN1cicbuK+70Xt9Knbfp+Y4N2YmwtKNYCEM8Z0qhmCwbBzwKypkwvbcxqhUlYrRDaKYbM7E4gI2lznkxcp5KOT1bXD6a2YvKBAV6xAp0IkphVPYP5tUXm6qU4+sDSKbsgzMkIgjryCMQ0eYsxzGOiXMVHeDj3qtP2DMb9X6/qq0r3AMoKuVzVCZHkB7MSEKUw6Y8UEZ5WMiob8/DNW8a3w2dx4Vk1NHwRR1Xni2vtIT3ZOROQMEyEr6pv4LIirQ14DmrJesi5r7MJpLnQaaVzVxqxjsI/aeeCZCyFi3oF/XxQa969gfD+XsiWVvF2ILOthnW807IQlHUdvpTwR16J1R1jDJ85vjHZx29TtuO52XHeBrcsY8jfTER2Z26UFejXSlTXhj7aEelez7p7UNwAC1pfPis/0IiNfPi7RVcdzgcZs0/PUVO1mDPRHcNFbQwT2D/z9ffKS6o29ENkA87LnpWx5rINoPoy36Pnd/lrmLCbmI/ZNu26JKznBsMIc5Gi+2nbTIB2JgqhR8y1/1DADMZStmzOhhYIFohfVmiFSG8y9IgtcJrEOGq8Zu5umF1rUPSbAg6zJLYzN4xi4i/AzWySJ7MLFGPgY6rthvDk8iVAO0mchskHQCl9rTeOWvA5gQr6t603LYsL9dtd1oklv3PRlT4N2ebRDu8ZWxhY/+GnpQOy0P1mi2xZpk8Eb34DURJ+WfhziaqCxod2XUyPQNZHVZf4E/E/i139a4mLyCqyS3c7KR/DSOyQvoGTDJUSWDCe+yop7GnoOQ29b9umJuEKY/+KHh/E7FPAZ+2l1kugMJjmJryR2UqFdmoZhwHnXu+vt7yFSY33aopDaIAPf41onOtLLzO3Eoyvq35gLr2Jc3mJr6JwvXdVirDx9F6IfmkJgg42PEFkSvNjKdA8ubbQvjyK3ZPUcy81mkuoyu8aJnTXs0sLOp555BYR2niXZqM8ZW0GpsLFASG3QwaAA/221WwDe+/GCeFP3yyyE+ZbEpUjEJJ3m4CqHQdtd8euFyPoNMHurfypidXTXk2nc6K/j7bk4kM4rrwnFuwMitGCXRs+ynvQxRoI4fzWlHkO40JLa1N+b2B3B7oMftEM05cFB1wbbz+Ib/g/lew1uEBbOjhdEr9+iY30GX9lpmT69jDx5zY+K1ytEFjfAZHk05iDEBXKdCHnaW9Hx+/ilWWgLEuvSoLMxN7YNBG0C9lcdZduI/OZ/CayfL6KO51HH48Dhz+g3YiI9fEd5cuHnpVgXdieNgPqgo4FeyhEU/y2qr0rTOaOCSAuXBSRPNUOatlboXiEyN5hta5O505q+qbQXtTmNL/eNXHTMYqIFnvROwcyGAp/PIv0M/+auCfurub9HxdVWqJlI3RMOPgf58WKOL5THjIrLhxa+yqUfirsznJKo654Oy19cm/vhmiSO1cAxmURCrf6AD/VvxcaxCmFlMWOHqkOIjHQeM7UbsPO4BTsPXlhBWcIEPVy5CcrOmbPoJpObIZFJXxYhtWiEQaeujRGKElrvCdhvlm2tRwrqTXpt0uviSRK/+imJwn006jhcYH6CQO1vDLXS5KZcEZhcImOHU9J/HYpZlAu+6ZvetpNTCJMaDBo18wGQ+nvRcTYMdJbhdETx9XQSYj5ok9NpMJbkEkMlyAZC3vPvBoHdCnZ+XZugPfMyRPMfT+RcyGcccqt1MomMdGBKfQkfckbkYjBpa/prUMIenlhFd+c0450b+UfRJ5p7jMQrF/cZ3Ec+bc8DS9ITsT6N9U/sItJZutxX2vql+AnPYispy6OFSCpKVC8k0mF2WqPdaiACk7kQPwYF/XWyiIw98InArgzEIuR1MvpWvHXJ+ije770mqtO1EbFRSp4wORnQPxWNPW7EOGJ3PuQMfCwRsYxqkfQiMGP+jk7cLXNhVAOR3XMmg8hIZJpS34LYBCueD56Ef6SbRWwZJUKj3VrIMohv7AR6bscDaNfUgqiG+NIxhUzRi0zBmKM1u1gEc+Gv+PKFUhpz0o1iZe6uPpHZBWeQUUCfG9J9fFtt6M/LDiyjeUw7nGkQGiVQVDZgvrPAQTeU4Zb+6hxBKRZ0+YFjGbUkvpre7jRCYLkCP7rKq0tk7PV+H8jrQEBg6gk4sH6sEA6soxvj0T+JRXjOvdad1/8VkNh5kR0RtxBhU1YUzUYM7edO45njdgcm7hKjnxs5PbGaRMZe7r/C540cimP+A3HiQGbB2zkNRiWrjWaEjUYd8M6sWwx1oVOqdhr52X6pnhrgvE8ee1ijkQpHw50mPMOFwCo5xahT1SOy+caX0au72iPmmZ9CjNwvYmRB5rA9vs7XrbksHtGmsRjKJOdiQjke0UC/Fpe9g5NY3gDiuh5j/46u3Z5BwknOJLFaEBSkGRkjUB0iI8fW6dp3oKe51NIzZX2o6Y/KLizjGZN1dYHRYC+qDlw8mMTovxQt2unPtoh40KdxLNq5uGIfPuTiwSWswNf6u7CnUiYJIbCsx61g9VWDyHbddDXSQ/+mPZENsgqsQ0cjE7hg022L5oTFUG0+DlbinGquxPuuRYO4DXRsHAvbLFfnpbVpECg/ke2u34md171tEDxzN4KayVdMStkR2NXA8XE2VfQ+fDh5ZUBqod1XeCfmp8UZhTW07PhWqP3lJrLd9XtBYvALohFBfJzBKdzLzW7P7woNWOW7wsp6Cmwn/zSyfkZL7zhKPqCFSndQe/Gccis/kKPtYHmJbK7+ayh338NWSfVHiJJXikJ/tJMnk6cFp2nvteQVTv/c/YBT0Jg1bQ44KsH5mMmtoRRnmaWbRyYgSCVpESgnkc3Vj2InBh0KimcexWGlFOAspQwIBGd8EnHRjot2YPHFRA5t6R9CtrU1FHGg/o7NPY3cPITYsps19FKiMgbddPmIbG7/N5G/6pM++kuwSpIIIqXICMzfTIcT0xkHNFZsYewtIvIJQ5Q6PI3Dai9raIBTN7HR33i3RvnFlpXxTg/kw1bkMcizbe4UMY3MKfRyWG6+Ic/HxdVdLiLbtf8T2ImByJDe1DMPYSd246gBk+clQCAgLtpxEYE5f7A4z8XgcOK8Avc5ZRO1g9vTHW1ADXwJLMb56DqTKzK5rVqCU3pFrZtTE6/GCCInPgNMwoaYIyAySrk+0lIeIrOmefMXuxKMeRYkxvnTpYwfgUGIi1JBkzjnUQA5PuMwzmxFbO3zDDTOCTW1WIA5+oDz72uQG6URyjtmdPwjrZSLnHAH8UQYxDyDxJOXjqOZ5SGy+Tqd1TgDFltXywtR/6JxIDfJz3SWRd7dBKJ9L3GRfLsceaURF/PCnONyr/CD3kln9yF84pNKKhUvkgZt83duJJ6C4LQ5MxayzhIrZ5DxzB2xkRMKp9qT715W57cO0fZyEBkffvoI+3l7t6knH7x/iL7KLcMiECYuFs929K2q6MSVBIcwubmDSuJDqri2cMxoXN7/YAdHQkWL70HIFZWiiap8ehi5wHA4mQqNd0EjJ8pBZHP1X0AvhlAUnKq9rt888fqJJAsxzTW7ELs4Nb0Pb42dvk5pdovqTuHvi1ZcLOKOKw0Wnfd2nnegFGETzZ4bvoeSTlLCyc4Sny6cRFUSWVdxzyoYLzi5alMfz2XeU1SMnr4YxDVviYssyVScQcb927WfX1KHx7n7ihvO4hMZh61AN4ZCCv4nRcGf5bps10V6LmXYCdVZFumP8eIiWxZpZyHnMzKEbLmbtR/etRLBRRNOxg6c3gDI0z3HNJ7w4lN+M+m0InVFj73jP3Hb6MORrGEWiGcEMsgswleT0sCv5jL/UlZafCLb0zgEEO+x/TTqXrzxP5uyz3I7IRD4cxF5XY9PkFe/e1YIcQ07a2xWWltIB0ciOYlrO5ITnX+3QUp2bJ3azei3cvudItU2ZHQQWLh/HK9Kx92V5kVVfCKba7wGQLdbnHm7SxaiT1dehBl24fS7z1rrNDK4YudFPl29Rt8gc4jSD6GqFt7CraK+hfOAaOR1cnbd2QjJsYhHBf53ObfIILRP659ZtQCRV0lVA3nDlH4U9tRfxaLiGDqjzuK/5/uERk6TXywr8OmBSVgDi+aUfroB3HiBxIsrx6z4MC6XiITdmcjLnOHBdd6JsL3BoHHuFXPMhwnTiVTjcH3JaQCLT2TUcRIvVVu8pB0aLcZzAkLTOET3ATIBSyEEWCF9rb/rig8BGiT8R1AVBAqOQDmIjEDknUUTC5TMwlw83yLEvVj1FZJHJlIUmrv5WhsGxMe1zbYxCo+wUc/h94ftrmuMPj8FXxPSvBIiUB4ic+CydYjEpHobb6M4PbLrDenRNHZpa+ZYZUnNiYwcAkRZQOIPwVWKLU6cbFBSHJVwkUqTt0agfETm+sQL+VCU0KCkNugS+e0EPaOdWgs/nlCbm8dLGwQczhrBZ0nyrquXewSluxF919YrQK6oBALlJbKA0Ci8pAGrTwM/hXO+07Fj05bUqERFLHY85BQu8MmxgcBnCrV7i+bpIj1XkJc+nryWfNFarIyVWJrSiUEQKD+RhXvLoTREaCR6BqJWe+GHnA97+9rQDo48qwOnQxdKQs/KOpxk90E+9Xpqc876F7HpnUiLw4B6t5NFxhL5+gwyMeVaQWAQBKpFZN2kxiEXcQdZRFAigrOsETgc9k89E9zNKV4GKeQMGVgS410hojtIJjTOGsEe1rLrGgRxubbyCFSXyDqHzvniBD44zsM6sIImGu4tQkoS1dF3p+Vq4Dxd1nAxpnQ3Sfsi1wkCY0ZgcoisH9Bhh8OaHzQ7bCjJoAPKoSfHcRsHCpOH9QbIa6VJoq0UQUAQSICAEFkCkCKXBLFzqh1WkrwO9qqmsgHSKmgAbvLuyJWCQDEQECIrxjhIKwQBQSAFAkJkKcCTWwUBQaAYCAiRFWMcpBWCgCCQAgEhshTgya2CgCBQDAT+D0UU3Zk6De+6AAAAAElFTkSuQmCC"
                            }, {
                                "driverStatus": "A",
                                "bookingRef": "booking-ref-3",
                                "date": "29/06/2016",
                                "startHour": null,
                                "endHour": null,
                                "disposalSite": "Disposal Site A",
                                "service": "Delivery",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "contractName": "Mr A. Gardener",
                                "address1": "23 Shuttle Gardens",
                                "postcode": "SS1 1SS",
                                "specialInstructions1": "Large back gate will be open",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }, {
                                "driverStatus": "I",
                                "bookingRef": "booking-ref-2",
                                "date": "29/06/2016",
                                "startHour": "11",
                                "endHour": null,
                                "service": "Collection",
                                "disposalSite": "Disposal Site A",
                                "movementCode": "M3",
                                "movementDesc": "Collect large skip",
                                "contractName": "ABC Contractors",
                                "address1": "2 Pebble Close",
                                "postcode": "PP1 1PP",
                                "specialInstructions1": "Call ahead on 01212121212",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": ""
                            }, {
                                "driverStatus": "A",
                                "bookingRef": "booking-ref-11",
                                "date": "29/06/2016",
                                "startHour": null,
                                "endHour": 20,
                                "service": "Collection",
                                "movementCode": "M1",
                                "disposalSite": "Disposal Site A",
                                "movementDesc": "Collect small skip",
                                "contractName": "Bill Bragg",
                                "address1": "16 Lewis Hill Road",
                                "postcode": "SE5 7HB",
                                "specialInstructions1": "Call ahead on 07979797979",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "quantity"
                            }, {
                                "driverStatus": "A",
                                "bookingRef": "booking-ref-4",
                                "date": "30/06/2016",
                                "startHour": "8",
                                "endHour": null,
                                "service": "Delivery",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "contractName": "Mr A. Gardener",
                                "address1": "17 High Cross",
                                "postcode": "DE28 9JB",
                                "specialInstructions1": "Large back gate will be open",
                                "disposalSite": "Disposal Site A",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }, {
                                "driverStatus": "A",
                                "bookingRef": "booking-ref-6",
                                "date": "30/06/2016",
                                "startHour": "9",
                                "endHour": "12",
                                "service": "Collection",
                                "disposalSite": "Disposal Site A",
                                "movementCode": "M1",
                                "movementDesc": "Collect small skip",
                                "contractName": "Bill Bragg",
                                "address1": "67 Mapel Drive",
                                "postcode": "AA1 3KP",
                                "specialInstructions1": "Call ahead on 07979797979",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }, {
                                "driverStatus": "A",
                                "bookingRef": "booking-ref-12",
                                "date": "30/06/2016",
                                "startHour": "10",
                                "disposalSite": "Disposal Site A",
                                "endHour": null,
                                "service": "Collection",
                                "movementCode": "M3",
                                "movementDesc": "Collect large skip",
                                "contractName": "ABC Contractors",
                                "address1": "76 April Street",
                                "postcode": "WA8 0KL",
                                "specialInstructions1": "Call ahead on 01212121212",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }, {
                                "driverStatus": "P",
                                "bookingRef": "booking-ref-13",
                                "date": "30/06/2016",
                                "startHour": "13",
                                "endHour": null,
                                "service": "Delivery",
                                "disposalSite": "Disposal Site A",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "contractName": "Mr A. Gardener",
                                "address1": "2 York Road",
                                "postcode": "AN8 3KL",
                                "specialInstructions1": "Large back gate will be open",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }, {
                                "driverStatus": "P",
                                "bookingRef": "booking-ref-10",
                                "date": "01/07/2016",
                                "disposalSite": "Disposal Site A",
                                "startHour": "10",
                                "endHour": null,
                                "service": "Delivery",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "contractName": "General Stockists",
                                "address1": "15 Shortlands Drive",
                                "postcode": "DE11 8JB",
                                "specialInstructions1": "",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }, {
                                "driverStatus": "P",
                                "bookingRef": "booking-ref-15",
                                "date": "01/07/2016",
                                "disposalSite": "Disposal Site A",
                                "startHour": "11",
                                "endHour": null,
                                "service": "Delivery",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "contractName": "General Stockists",
                                "address1": "4 Bridge Street",
                                "postcode": "TD8 4DN",
                                "specialInstructions1": "",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }, {
                                "driverStatus": "P",
                                "bookingRef": "booking-ref-5",
                                "date": "01/07/2016",
                                "startHour": "14",
                                "endHour": null,
                                "service": "Delivery",
                                "movementCode": "D1",
                                "movementDesc": "Deliver small skip",
                                "contractName": "General Stockists",
                                "disposalSite": "Disposal Site A",
                                "address1": "Belvoir Court",
                                "postcode": "C1 3FG",
                                "specialInstructions1": "",
                                "driverEtaDate": "",
                                "driverEtaHour": "",
                                "unit": "tonnes"
                            }]
                    });
                    window.commsManager.runCallBackFunction("success", commsMessage.callback, response);
                }
            }
            if (processed) {
                CommsManager.showLoader(false);
                return false;
            }
            //******************************************************************************************************************
            // Dummy requests for testing before the API is live
            //*****************************************************************************************************************
        }
        // This is where the real work will be done.
        switch (commsMessage.endpoint.method.toUpperCase()) {
            case "ZUMO":
                var zumoMethod = commsMessage.endpoint.url.toLowerCase();
                window.logManager.log(["Sending ZUMO request: ", commsMessage.message]);
                window.mCapture.fl.notifyreceivemessagenotification({
                    resume: function () {
                        window.logManager.log("Setting post notification");
                    }
                }, "postNotification", "ZumoRequest", zumoMethod, zumoMethod);
                window.mCapture.fl.zumorequest({
                    resume: function () {
                        window.logManager.log("Zumo request sent");
                    }
                }, zumoMethod, zumoMethod, zumoMethod, commsMessage.message, commsMessage.ttl, true);
                break;
            case "PLUGIN":
                var dataMethod = commsMessage.endpoint.url;
                window.logManager.log(["Sending data request: ", commsMessage.message]);
                window.mCapture.fl.notifyreceivemessagenotification({
                    resume: function () {
                        window.logManager.log("Setting post notification");
                    }
                }, "postNotification", "DataRequest", dataMethod, dataMethod);
                window.mCapture.fl.datarequest({
                    resume: function () {
                        window.logManager.log("Data request sent");
                    }
                }, dataMethod, dataMethod, dataMethod, commsMessage.message, commsMessage.ttl, true);
                break;
            case "GET":
            case "POST":
            case "PUT":
            case "DELETE":
                if (jQuery === undefined) {
                    window.logManager.log("jQuery is not defined", "", "ERROR");
                    return false;
                }
                // Check for a web connection, if we don't have one, queue the message for processing later.
                if (!window.commsManager.canConnect()) {
                    CommsManager.showLoader(false);
                    AppManager.dealWithError({
                        header: "Connection",
                        text: "No connection is available - please try again when you have an internet connection."
                    });
                    return false;
                }
                var jqXHR = jQuery.ajax({
                    method: commsMessage.endpoint.method.toUpperCase(),
                    url: endpoint,
                    data: commsMessage.message,
                    crossDomain: true
                })
                    .done(function (data, textStatus, jqXHR) {
                    window.logManager.log(commsMessage.endpoint.method.toUpperCase() + " request success: " + textStatus + " URL: " + endpoint, " Message: " + window.commsManager.outputSafeMessage(commsMessage.message));
                    window.commsManager.runCallBackFunction("success", commsMessage.callback, data);
                })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                    window.logManager.log(commsMessage.endpoint.method.toUpperCase() + " request failed: Status: " + textStatus + " URL: " + endpoint, " Message: " + window.commsManager.outputSafeMessage(commsMessage.message));
                    window.commsManager.runCallBackFunction("error", commsMessage.callback, errorThrown);
                })
                    .always(function () {
                    window.commsManager.runCallBackFunction("always", commsMessage.callback);
                    CommsManager.showLoader(false);
                });
                break;
            default:
                if (commsMessage.endpoint.method === undefined || commsMessage.endpoint.method === "") {
                    window.logManager.log("Comms Type not set - as options.comms nor as requestType in this commsMessage.", "", "ERROR");
                }
                else {
                    window.logManager.log("Comms Type (" + commsMessage.endpoint.method + ") invalid.", "", "ERROR");
                }
                CommsManager.showLoader(false);
                break;
        }
    };
    CommsManager.prototype.processResponse = function (response) {
        var responseAction = response.actionType || "", responseData = !Helper._undefinedOrNull(response["data"]) ? response.data : null, dealtWith = true;
        // Check that we at least have some response data - can't do anything if not!
        if (Helper._undefinedOrNull(responseData)) {
            AppManager.dealWithError({
                header: "Data Error",
                text: "There was a problem with the data received from the server."
            });
            window.logManager.error("Missing or null 'data' attribute from response message");
            // In case the loading is still displaying, get rid now.
            CommsManager.showLoader(false);
            return false;
        }
        var responseType = !Helper._undefinedOrNull(responseData["type"]) ? responseData.type : "", success = !Helper._undefinedOrNull(responseData["success"]) ? responseData.success : false, infoMessage = !Helper._undefinedOrNull(responseData["infoMessage"]) ? responseData.infoMessage : false, msgId = !Helper._undefinedOrNull(responseData["msgId"]) ? responseData.msgId : null, msgType = !Helper._undefinedOrNull(responseData["msgType"]) ? responseData.msgType : null;
        switch (responseAction) {
            case "navigate":
                window.navigationManager.goToPage(PageConfig[response.data.pageName]);
                break;
            case "refresh":
                window.jmfw(response.actionOptions.tagName)[0].refresh();
                break;
            case "fail":
                CommsManager.showLoader(false);
                break;
            default:
                // If we haven't been given a direct order, try to use the type of response we're dealing with to process the result.
                // Check for an invalid session, this means the user's token has expired and they need to be returned to the login screen.
                if (!Helper._undefinedOrNull(responseData["errorMessage"]) && responseData.errorMessage.toUpperCase() === "INVALID SESSION") {
                    AppManager.dealWithError({
                        text: "Your session has expired. Please login again.",
                    }, [function () {
                            AppManager.reset();
                            window.navigationManager.goToPage(PageConfig.Login);
                        }]);
                    return false;
                }
                // Checks for application-level errors first. Continue as each method may want to react differently.
                if (!Helper._undefinedOrNull(response.error))
                    window.logManager.error(response.error);
                // Check for API-level errors - i.e. messages contained within the data object.
                if (!success) {
                    // The request has failed so display the error message.
                    // Let the individual responses take care of what to do with the user.
                    var errorText = !Helper._undefinedNullOrEmptyString(responseData.errorMessage) ? responseData.errorMessage : false;
                    window.logManager.error(["Success was false", errorText || responseData]);
                }
                // Plugin can return info messages with any request that should simply be displayed to the user, requiring no interaction.
                if (infoMessage)
                    AppManager.popup({
                        titleText: "Information",
                        messageText: infoMessage,
                        type: "OK"
                    });
                switch (responseType.toLowerCase()) {
                    case "driverlogin":
                        Login.loginResponse(responseData);
                        break;
                    case "drivergetdata":
                        Driver.driverDataResponse(responseData);
                        break;
                    case "updatejob":
                        Job.updateJobResponse(responseData);
                        break;
                    case "jobupdate":// Job has been updated externally.
                        // Do any necessary auth at this point.
                        Job.jobUpdateResponse(response);
                        dealtWith = false; // We don't want to delete the message yet, this will be taken care of when the user is notified of the update.
                        break;
                    case "uploadphoto":
                        break;
                    default:
                        window.logManager.log("Unrecognised response type: " + responseType);
                        AppManager.dealWithError({
                            text: "There was an error, please try again."
                        });
                        dealtWith = false;
                        break;
                }
                break;
        }
        // If we've dealt with the message, delete it now, otherwise, let it hang around. <- I don't think this is a good idea but we'll see.
        if (dealtWith && msgId)
            this.deleteMessage(msgId);
        CommsManager.showLoader(false);
    };
    CommsManager.prototype.deleteMessage = function (id, callback) {
        if (Helper._undefinedNullOrEmptyString(id))
            return;
        window.mCapture.fl.notifydeletemessage({
            resume: function (e) {
                (callback || window.logManager.log)(e);
            }
        }, id);
    };
    CommsManager.prototype.pushListenerAddChannel = function (channel, receiver) {
        var _this = this;
        // Channel names must be lower case and at least 2 characters so we will sort that here.
        channel = "epod_" + channel;
        channel = channel.toLowerCase();
        window.mCapture.fl.notifyaddchannel({
            resume: function (err) {
                if (err.message !== undefined) {
                    window.logManager.log("Problem setting up push listener on channel " + channel + ": " + err.message, "", "ERROR");
                }
                else {
                    _this.pushListenerActive = true;
                    _this.pushListenerChannel = channel;
                    window.logManager.log("Listening on channel " + channel);
                    window.logManager.log("Setting up receiver...");
                    _this.pushListenerSetupReceiver(channel, receiver || null);
                }
            }
        }, channel);
    };
    CommsManager.prototype.pushListenerSetupReceiver = function (channel, receiver) {
        // Check that the channel listener has been set up before setting up the receiver.
        if (!this.pushListenerActive) {
            window.logManager.log("Must call pushListenerAddChannel before setting up receivers.", "", "WARN");
            return;
        }
        // If we're not specifying a receiver, use the generic mD option.
        if (Helper._undefinedNullOrEmptyString(receiver))
            receiver = "postNotification";
        window.logManager.log("Setting up listener receiver: " + receiver);
        window.mCapture.fl.notifyreceivemessagenotification({
            resume: function (err) {
                if (err && err.message !== undefined) {
                    window.logManager.log("Problem setting up listener receiver: " + err.message, "", "ERROR");
                    return;
                }
                window.logManager.log("Set up push listener receiver.");
            }
        }, receiver, receiver, channel, channel + "_sub");
    };
    // Stop listening on the given channel.
    CommsManager.prototype.pushListenerRemoveChannel = function (channel) {
        if (window.commsManager.pushListenerActive)
            window.mCapture.fl.notifyremovechannel({
                resume: function (err) {
                    if (err && err.message !== undefined) {
                        window.logManager.log("Problem removing listener channel: " + err.message, "", "ERROR");
                        return;
                    }
                    window.logManager.log("Stopped listening on channel ", channel);
                }
            }, channel);
    };
    // Sends an ASB message.
    CommsManager.prototype.pushListenerSendMessage = function (channel, msg) {
        window.mCapture.fl.notifysendmessage({
            resume: function (e) {
                window.logManager.log(e);
            }
        }, channel, channel + "_sub", msg, "Hey! Listen up.", 10000);
    };
    CommsManager.prototype.runCallBackFunction = function (type, callback, data) {
        if (callback !== undefined && typeof callback === "object" && callback[type] !== undefined && typeof callback[type] === "function")
            callback[type](data !== undefined ? data : null);
    };
    CommsManager.prototype.canConnect = function () {
        return window.mCapture.fl.canconnectatleast("2g") || window.mCapture.fl.canconnectviawifi();
    };
    // For debugging purposes will remove any sensitive data from the message being passed
    CommsManager.prototype.outputSafeMessage = function (message) {
        var safeMessage = message, valuesToBlank = ["password"];
        for (var i = 0; i < valuesToBlank.length; i++) {
            if (safeMessage.hasOwnProperty(valuesToBlank[i]))
                safeMessage[valuesToBlank[i]] = "*".repeat(safeMessage[valuesToBlank[i]].length);
        }
        return JSON.stringify(safeMessage);
    };
    CommsManager.showLoader = function (show) {
        var showHide = show || show === undefined ? "show" : "hide", activityLoader = window.jmfw("activity-loader")[0];
        if (activityLoader)
            activityLoader[showHide]();
    };
    return CommsManager;
}());
// Initialise CommsManager
window.commsManager = new CommsManager(options.comms);
// DataManager class
// Used for managing how we store and
// retrieve data for use within the app.
var DataManager = /** @class */ (function () {
    function DataManager() {
        this.localStorage = window.appManager.localStorage;
    }
    // Gets a variable from the selected storage medium
    DataManager.prototype.getItem = function (item) {
        var result = undefined;
        if (this.localStorage) {
            result = localStorage[item];
            try {
                if (result !== undefined && result !== "undefined")
                    result = JSON.parse(result);
            }
            catch (ex) {
                window.logManager.log(['ERROR: %s', ex], "", "ERROR");
            }
        }
        else {
            var cso = window.mCapture.currentsubjectobject();
            result = cso[item];
        }
        return result;
    };
    // Sets a variable in the selected storage medium
    DataManager.prototype.setItem = function (item, value) {
        if (this.localStorage) {
            // if (value instanceof Object) {
            //   value = JSON.stringify(value);
            // }
            try {
                localStorage[item] = JSON.stringify(value);
            }
            catch (ex) {
                window.logManager.log(['ERROR: %s', ex], "", "ERROR");
            }
        }
        else {
            var cso = window.mCapture.currentsubjectobject();
            cso[item] = value;
        }
    };
    // Deletes a variable from the selected storage medium
    DataManager.prototype.deleteItem = function (item) {
        if (this.localStorage) {
            delete localStorage[item];
        }
        else {
            var cso = window.mCapture.currentsubjectobject();
            delete cso[item];
        }
    };
    return DataManager;
}());
// Initialise DataManager
window.dataManager = new DataManager();
var EmailManager = /** @class */ (function () {
    function EmailManager() {
    }
    EmailManager.prototype.sendJobUpdateEmail = function (updateType) {
        var job = Job.getCurrentJob(), subject = "Job Update: " + job.bookingRef + " [" + updateType.toUpperCase() + "]";
        this.sendEmail(subject, "This will be overwritten by the server", "", updateType, job);
    };
    EmailManager.prototype.sendEmail = function (subject, htmlBody, plainTextBody, emailType, job) {
        if (subject === "" || htmlBody === "") {
            window.logManager.log("Subject and Body are required properties to send emails.", "", "ERROR");
            return false;
        }
        window.commsManager.sendMessage({
            endpoint: options.endpoint.sendMail,
            message: {
                emailType: emailType,
                emailSubject: subject,
                htmlBody: htmlBody,
                plainTextBody: plainTextBody || "",
                job: job
            },
            callback: {
                success: EmailManager.sendEmailResponse
            }
        });
    };
    EmailManager.sendEmailResponse = function (responseData) {
        // Connected but something failed
        if (!responseData.success) {
            AppManager.dealWithError({
                text: "There was a problem sending email. Please try again later."
            });
            return false;
        }
        return true;
    };
    return EmailManager;
}());
window.emailManager = new EmailManager();
// class EventManager {
//   eventHistory: EventObject[];
//   constructor() {
//     this.eventHistory = [];
//   }
//   createEvent(messageType: string, type: string, vehicleId: string, routeId: string): EventObject {
//     var id = window.mCapture.db.guid();
//     var ts = new Date().toISOString();
//     var event: EventObject = {
//       EventId: id,
//       messageType: messageType,
//       Type: type,
//       VehicleId: vehicleId,
//       RouteId: routeId,
//       TimeStamp: ts,
//       Latitude: '0',
//       Longitude: '0'
//     }
//     var location = window.mCapture.db.getCachedPosition();
//     if (location !== undefined) {
//       event.Latitude = location.coords.latitude;
//       event.Longitude = location.coords.longitude;
//     }
//     return event;
//   }
//   sendEvent(event: EventObject): void {
//     this.eventHistory.push(event)
//     // window.commsManager.sendMessage('Event', event);
//   }
// }
// // Initialise EventManager
// window.eventManager = new EventManager(); 
// We save the last cached position in case there is a scenario where we can't retrieve it, we can still then access the last position.
var GPSManager = /** @class */ (function () {
    function GPSManager() {
    }
    GPSManager.prototype.getCachedPosition = function () {
        this.lastCachedPosition = window.mCapture.db.getCachedPosition();
        return this.lastCachedPosition;
    };
    GPSManager.prototype.getCoord = function (type) {
        var cachedPosition = this.getCachedPosition();
        if (Helper._undefinedOrNull(cachedPosition) || Helper._undefinedOrNull(cachedPosition.coords))
            return 0;
        return this.lastCachedPosition.coords[type] || 0;
    };
    // Return the latitude value if we have one
    GPSManager.prototype.getLatitude = function () {
        return this.getCoord("latitude");
    };
    // Return the longitude value if we have one
    GPSManager.prototype.getLongitude = function () {
        return this.getCoord("longitude");
    };
    return GPSManager;
}());
window.gpsManager = new GPSManager();
var LogManager = /** @class */ (function () {
    function LogManager() {
    }
    LogManager.prototype.log = function (entries, subject, logType) {
        var logMethod = logType || options["logMethod"] || "CONSOLE";
        // Check if entry is an array.
        if (!Array.isArray(entries))
            entries = [entries];
        // Use the appropriate console. function.
        switch (logMethod.toUpperCase()) {
            case "DEBUG":
                if (!options.debug)
                    return;
            case "CONSOLE":
                logMethod = "LOG";
            case "ERROR":
            case "WARN":
                entries.forEach(function (entry) {
                    if (typeof entry === "object")
                        entry = JSON.stringify(entry);
                    console[logMethod.toLowerCase()]((subject ? subject + ": " : "") + entry);
                });
                break;
            default:
                console.log("LogMethod: " + logMethod + " not supported.");
                break;
        }
    };
    ;
    LogManager.prototype.debug = function (entries, subject) {
        this.log(entries, subject, "DEBUG");
    };
    ;
    LogManager.prototype.info = function (entries, subject) {
        this.log(entries, subject, "CONSOLE");
    };
    ;
    LogManager.prototype.warn = function (entries, subject) {
        this.log(entries, subject, "WARN");
    };
    ;
    LogManager.prototype.error = function (entries, subject) {
        this.log(entries, subject, "ERROR");
    };
    ;
    return LogManager;
}());
window.logManager = new LogManager();
// NavigationManager class
// Handles navigation between pages and
// components. Will keep track of page
// viewed history.
var NavigationManager = /** @class */ (function () {
    function NavigationManager() {
        this.navHistoryComplete = [];
        this.navHistoryCurrent = [];
    }
    NavigationManager.prototype.navigate = function (tagName, pageName, loading) {
        window.jmfw(this.lastPage).remove();
        // Reset the window to the top for the new page.
        window.scrollTo(0, 0);
        var newPage = document.createElement(tagName);
        newPage.classList.add("md-page");
        // Set the default background colour - controlled by .
        var htmlTag = document.querySelector("html");
        if (PageConfig[pageName].isDark)
            htmlTag.classList.add("dark-bg");
        else
            htmlTag.classList.remove("dark-bg");
        newPage.setAttribute('pageName', pageName);
        document.body.appendChild(newPage);
        // Allow the loader to persist if required (used when sending AJAX requests and loading the page prior to retrieving the data).
        if (loading)
            CommsManager.showLoader();
    };
    NavigationManager.prototype.goToPage = function (page, loading) {
        if (Helper._undefinedOrNull(page)) {
            window.logManager.log("Page '" + page.toString() + "' could not be found", "", "ERROR");
            return false;
        }
        this.navigate(page.tagName, page.name, loading || false);
    };
    NavigationManager.prototype.pageBack = function () {
        if (this.navHistoryCurrent.length > 1) {
            var lastPage = this.navHistoryCurrent[this.navHistoryCurrent.length - 2];
            this.navigate(PageConfig[lastPage].tagName, lastPage);
            this.navHistoryCurrent.pop();
        }
    };
    NavigationManager.prototype.pushPage = function (page) {
        if (this.navHistoryComplete[this.navHistoryComplete.length - 1] != page.pageName)
            this.navHistoryComplete.push(page.pageName);
        if (this.navHistoryCurrent[this.navHistoryCurrent.length - 1] != page.pageName)
            this.navHistoryCurrent.push(page.pageName);
        this.lastPage = page;
        // Set the current app state.
        window.stateManager.saveState(page.pageName, window.dataManager.getItem("currentJobId"));
    };
    NavigationManager.prototype.removeLastPage = function () {
        if (this.navHistoryCurrent.length > 1)
            this.navHistoryCurrent.pop();
    };
    NavigationManager.prototype.getCurrentPageName = function () {
        return this.navHistoryCurrent[this.navHistoryCurrent.length - 1];
    };
    NavigationManager.prototype.clearHistory = function () {
        this.navHistoryCurrent = [];
    };
    return NavigationManager;
}());
// Initialise NavigationManager
window.navigationManager = new NavigationManager();
var PrintManager = /** @class */ (function () {
    function PrintManager() {
    }
    // Returns HTML-formatted version of *all* job details.
    PrintManager.prototype.print = function (recipient) {
        var job = Job.getCurrentJob(), container = document.createElement("div"), header = document.createElement("div"), subHeader = document.createElement("div"), mainText = document.createElement("div");
        header.className = "job-print-header";
        subHeader.className = "job-print-sub-header";
        mainText.className = "job-print-text";
        // Set the output based on the current job status - if the job has been completed then we're after customer sign off, otherwise, this is for the client to confirm so
        // include the statutory sign off text.
        header.textContent = Helper._undefinedNullOrEmptyString(recipient) ? Helper._toProperCase(recipient) + " sign off" : "Sign Off";
        if (job.isComplete()) {
            subHeader.textContent = "This is the completed ticket";
        }
        else if (job.isBeingFailed()) {
            subHeader.textContent = "Please confirm failed job details";
        }
        else {
            subHeader.textContent = "Please confirm job details";
        }
        // Main job details
        var jobInfo = this.outputJobDetails(job, null, true);
        jobInfo.className = "job-print-info";
        mainText.appendChild(jobInfo);
        // If this summary is being displayed for the customer, show the statutory text, otherwise, show the driver 'statutory text'.
        var statutoryText = "";
        if (!Helper._undefinedNullOrEmptyString(recipient) && recipient === "customer") {
            statutoryText = CONSTANTS.CUSTOMER_STATUTORY_TEXT;
        }
        else if (!Helper._undefinedNullOrEmptyString(recipient) && recipient === "driver" && job.isBeingFailed()) {
            statutoryText = CONSTANTS.FAILURE_STATUTORY_TEXT;
        }
        else if (!Helper._undefinedNullOrEmptyString(recipient) && recipient === "driver") {
            statutoryText = CONSTANTS.DRIVER_STATUTORY_TEXT;
        }
        // If the job has not yet been completed then display the statutory text from above and offer the client the
        // opportunity to add comments (and email those comments appropriately).
        if (!job.isComplete() && statutoryText !== "") {
            var statutory = document.createElement("div");
            statutory.className = "job-print-statutory-text";
            statutory.textContent = statutoryText;
            mainText.appendChild(statutory);
        }
        // Add any additional info - displayed after the statutory text.
        if (recipient === "driver") {
            var additionalInfo = [];
            // We'll only have this data if the job has been successful.
            if (!job.isBeingFailed()) {
                // If we've forced measurement collection, add the info.
                if (job.requiredMeasurement !== "") {
                    additionalInfo.push({ isDivider: true });
                    var subTableData = [];
                    if (job.requiredMeasurement === CONSTANTS.MEASUREMENTS.TONNES) {
                        // Pad the kilos value for display.
                        var gross = job.gross.toString();
                        gross = gross.substr(0, gross.indexOf('.')) + '.' + Helper._padRight(gross.substr(gross.indexOf('.') + 1), 3, '0');
                        var tare = job.tare.toString();
                        tare = tare.substr(0, tare.indexOf('.')) + '.' + Helper._padRight(tare.substr(tare.indexOf('.') + 1), 3, '0');
                        var nett = job.nett.toString();
                        nett = nett.substr(0, nett.indexOf('.')) + '.' + Helper._padRight(nett.substr(nett.indexOf('.') + 1), 3, '0');
                        subTableData.push({ heading: "Gross Weight (Tonnes)", data: gross });
                        subTableData.push({ heading: "Tare Weight (Tonnes)", data: tare });
                        subTableData.push({ heading: "Nett Weight (Tonnes)", data: nett });
                        additionalInfo.push({ heading: "Weight Details", isSubTable: true, subTableData: subTableData });
                    }
                    else {
                        subTableData.push({ heading: "Quantity", data: job.nett });
                        additionalInfo.push({ heading: "Quantity Details", isSubTable: true, subTableData: subTableData });
                    }
                }
                if (job.requireStreams) {
                    // If we've collected stream breakdowns, add them here.
                    var subTableData_1 = [];
                    job.streams.forEach(function (stream) {
                        subTableData_1.push({ heading: stream.name, data: stream.value });
                    });
                    additionalInfo.push({ heading: "Breakdowns (%)", isSubTable: true, subTableData: subTableData_1 });
                }
            }
            // Add the read only name and signature if already signed off.
            if (job.isDriverSigned()) {
                additionalInfo = additionalInfo.concat([{
                        heading: "Driver Name",
                        data: job.driverName
                    }, {
                        heading: "Driver Signature",
                        isSignature: true,
                        data: job.driverSignature
                    }]);
            }
            if (!Helper._undefinedNullOrEmptyArray(additionalInfo)) {
                var additionalJobInfo = this.outputJobDetails(job, additionalInfo);
                additionalJobInfo.className = "job-print-info";
                mainText.appendChild(additionalJobInfo);
            }
            // Declaration only needs to be added if the job is being completed - if it is being failed or has already been completed it either won't be shown or will be output
            // elsewhere (in outputJobDetails()).
            if (!job.isBeingFailed() && !job.isDriverSigned()) {
                var additionalJobInfo = document.createElement("div");
                additionalJobInfo.className = "declaration";
                additionalJobInfo.textContent = "I have accepted the waste as directed on behalf of " + job.disposalSite;
                mainText.appendChild(additionalJobInfo);
            }
        }
        // Add everything to the container.
        container.appendChild(header);
        container.appendChild(subHeader);
        container.appendChild(mainText);
        return container;
    };
    // Returns a table of job information.
    PrintManager.prototype.outputJobDetails = function (job, infoOverride, isTicket) {
        var _this = this;
        var jobInfo = document.createElement("div"), infoTable = document.createElement("table");
        // Add rows for each data element - allowing us to pass in existing data if we like to utilise the output
        // functionality but setting our own data order / display.
        var infoData = [];
        if (Helper._undefinedNullOrEmptyArray(infoOverride)) {
            infoData = infoData.concat([{
                    heading: "Company",
                    data: job.companyName,
                }, {
                    heading: "SIC",
                    data: job.sicCode,
                }, {
                    heading: "Service Type",
                    data: job.service
                }, {
                    heading: "Container / Waste Type",
                    data: job.movementDesc + (job.movementCode !== "" ? " (" + job.movementCode + ")" : ""),
                }, {
                    heading: "EWC",
                    data: job.ewcCode,
                }, {
                    heading: "Order Instructions",
                    data: job.orderInstructions,
                }, {
                    heading: "Special Instructions",
                    data: job.outputSpecialInstructions(),
                }, {
                    heading: "Site Contact",
                    data: job.siteContactName,
                }, {
                    heading: "Disposal Site",
                    data: job.disposalSite,
                }
            ]);
            // Add ETA info if we have any.
            if (!Helper._undefinedNullOrEmptyString(job.eta))
                infoData.push({
                    heading: "ETA", data: job.eta
                });
            // Add service amendment info if we have any.
            if (!Helper._undefinedNullOrEmptyString(job.serviceAmendments))
                infoData.push({
                    heading: "Service Amendments",
                    data: job.serviceAmendments
                });
            // Add customer comments if we have any.
            if (!Helper._undefinedNullOrEmptyString(job.comments))
                infoData.push({
                    heading: "Customer Comments",
                    data: job.comments
                });
            // If this is for a ticket, also add...
            if (isTicket) {
                // Add some details at the top.
                infoData = [{
                        heading: "Booking Ref",
                        data: job.bookingRef
                    }, {
                        heading: "Date",
                        data: Helper._dates_format(job.datetime, "DD/MM/YYYY")
                    }].concat(infoData);
                // If the job has been signed by the customer, output the details at the bottom.
                if (job.isClientSigned()) {
                    infoData.push({
                        heading: "Customer Name",
                        data: job.clientName
                    });
                    infoData.push({
                        heading: CONSTANTS.CUSTOMER_STATUTORY_TEXT,
                        isDeclaration: true
                    });
                    infoData.push({
                        heading: "Customer Signature",
                        isSignature: true,
                        data: job.clientSignature
                    });
                }
                infoData.push({
                    heading: "Carrier Name",
                    data: job.wasteCarrierName,
                });
                infoData.push({
                    heading: "WCL",
                    data: job.wcl,
                });
                infoData.push({
                    heading: "Vehicle Reg",
                    data: Driver.getVehicleReg(),
                });
                // Declaration only needs to be added if the job is being completed - if it is being failed or has already been completed it either won't be shown or will be output
                // elsewhere (in outputJobDetails()).
                if (job.isComplete() && job.isDriverSigned()) {
                    infoData.push({
                        heading: "I have accepted the waste as directed on behalf of " + job.disposalSite,
                        isDeclaration: true
                    });
                }
            }
            else {
                // We only want to add the measurement and breakdown added notifiers if a. the job requires them, b. they have been submitted and c. this is
                // the normal job summary - i.e. not the ticket.
                // If we have uploaded any adhoc photos.
                if (job.adhocPhotos.length > 0) {
                    infoData.push({
                        heading: "Uploaded Photos",
                        data: job.adhocPhotos,
                        isPhotos: true
                    });
                }
                // If we have a measurement.
                if (!Helper._undefinedNullOrEmptyString(job.requiredMeasurement) && !Helper._undefinedNullOrNaN(job.nett)) {
                    infoData.push({
                        heading: "Measurement Recorded",
                        isStatement: true
                    });
                }
                // If the user has checked the streams.
                if (job.requireStreams && job.hasCheckedStreams) {
                    infoData.push({
                        heading: "Waste Breakdowns Checked",
                        isStatement: true
                    });
                }
            }
        }
        else {
            infoData = infoOverride;
        }
        infoData.forEach(function (info) {
            var infoTableRow = document.createElement("tr");
            var infoTableCellHeading = document.createElement("td");
            infoTableCellHeading.textContent = info.heading || "";
            infoTableRow.appendChild(infoTableCellHeading);
            // Allow for sub-tables...
            var rowToAdd = null;
            if (info.isSubTable) {
                // Cap the current row off and put the subtable in a new row.
                infoTableCellHeading.colSpan = 2;
                infoTable.appendChild(infoTableRow);
                // Build a holding row for the subtable.
                var holdingRow = document.createElement("tr"), holdingCell = document.createElement("td");
                holdingCell.colSpan = 2;
                holdingRow.appendChild(holdingCell);
                var subTable_1 = document.createElement("table");
                subTable_1.className = "sub-table";
                info.subTableData.forEach(function (info) {
                    var subTableRow = document.createElement("tr"), subTableCellHeading = document.createElement("td");
                    subTableCellHeading.textContent = info.heading;
                    subTableRow.appendChild(subTableCellHeading);
                    var subTableCellData = document.createElement("td");
                    subTableCellData.textContent = info.data;
                    subTableRow.appendChild(subTableCellData);
                    subTable_1.appendChild(subTableRow);
                });
                holdingCell.appendChild(subTable_1);
                rowToAdd = holdingRow;
            }
            else {
                var infoTableCellData_1 = document.createElement("td");
                // If we're dealing with normal data, just output that, if it's a sig, draw it.
                if (info.isSignature) {
                    var signatureEl = document.createElement("div");
                    signatureEl.id = Helper._safeId(info.heading, "-").toLowerCase();
                    infoTableCellData_1.appendChild(signatureEl);
                    // Horrible. (but it works)
                    setTimeout(function () {
                        var sigHolder = window.jQuery("#" + Helper._safeId(info.heading, "-").toLowerCase());
                        sigHolder.jSignature({ "decor-color": "transparent" });
                        sigHolder.jSignature("setData", info.data);
                        sigHolder.jSignature("disable");
                    }, 1000);
                    infoTableRow.appendChild(infoTableCellData_1);
                }
                else {
                    if (info.isStatement) {
                        // If this is a statement - i.e. single piece of information then simply extend the header cell
                        // and do not output a second cell.
                        infoTableCellHeading.colSpan = 2;
                        infoTableCellHeading.classList.add("positive-statement");
                    }
                    else if (info.isDeclaration) {
                        // If this is a declaration then simply extend the header cell
                        // and do not output a second cell.
                        infoTableCellHeading.colSpan = 2;
                        infoTableCellHeading.classList.add("declaration");
                    }
                    else if (info.isDivider) {
                        // If this is a divider, output something to divide!
                        infoTableCellHeading.colSpan = 2;
                        infoTableCellHeading.classList.add("divider");
                    }
                    else if (info.isPhotos) {
                        // This is an array of photos so output them in a list.
                        infoTableCellData_1.classList.add("photos");
                        info.data.forEach(function (p) {
                            infoTableCellData_1.appendChild(_this.drawPhoto(p));
                        });
                        infoTableRow.appendChild(infoTableCellData_1);
                    }
                    else {
                        infoTableCellData_1.textContent = info.data;
                        infoTableRow.appendChild(infoTableCellData_1);
                        infoTableCellData_1.classList.add("data");
                    }
                }
                rowToAdd = infoTableRow;
            }
            infoTable.appendChild(rowToAdd);
        });
        jobInfo.appendChild(infoTable);
        return jobInfo;
    };
    PrintManager.prototype.printHiddenMenu = function () {
        var container = document.createElement('div'), mainText = document.createElement('div');
        var appInfo = [{ name: 'Internal Version', value: options.internalVersion }];
        appInfo.forEach(function (info) {
            var infoDiv = document.createElement('div');
            var nameDiv = document.createElement('div');
            var valueDiv = document.createElement('div');
            nameDiv.textContent = info.name;
            nameDiv.classList.add('hidden-menu-info-name');
            valueDiv.textContent = info.value;
            valueDiv.classList.add('hidden-menu-info-value');
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(valueDiv);
            infoDiv.classList.add('hidden-menu-info');
            mainText.appendChild(infoDiv);
        });
        container.appendChild(mainText);
        return container;
    };
    // Draw out an individual photo
    PrintManager.prototype.drawPhoto = function (photo) {
        var photoPanel = document.createElement('photo-panel');
        photoPanel.photo = photo;
        photoPanel.deleteable = false;
        return photoPanel;
    };
    return PrintManager;
}());
// Initialise PrintManager
window.printManager = new PrintManager();
var ScreenManager = /** @class */ (function () {
    function ScreenManager() {
    }
    ScreenManager.prototype.setOrientation = function (orientation) {
        var lockOrientationUniversal = screen["lockOrientation"] || screen["mozLockOrientation"] || screen["msLockOrientation"];
        if (lockOrientationUniversal === undefined)
            return false;
        // Use the app's default if we haven't been passed anything.
        var o = orientation || options.defaultOrientation;
        var set = lockOrientationUniversal(o.toLowerCase());
        if (set)
            options.currentOrientation = o.toLowerCase();
        return set;
    };
    return ScreenManager;
}());
// Initialise ScreenManager
window.screenManager = new ScreenManager();
var StateManager = /** @class */ (function () {
    function StateManager() {
    }
    // Used when the application is restarted fresh - if the user has been logged in, take them back to where they were last.
    StateManager.prototype.restoreState = function () {
        // Reset the current job to the last saved job ID.
        Job.setCurrentJob(window.dataManager.getItem("currentJobId"));
        // Return the last saved page name to be used by appLauncher.
        var lastKnownState = window.dataManager.getItem("state");
        if (!Helper._undefinedNullOrEmptyString(lastKnownState) && lastKnownState.hasOwnProperty("page"))
            return lastKnownState["page"];
        return "";
    };
    // Save the current state of the application. Initially this covers the current page and job but can be extended in future.
    StateManager.prototype.saveState = function (page, jobId) {
        this.page = page;
        window.dataManager.setItem("state", this);
    };
    return StateManager;
}());
// Initialise StateManager
window.stateManager = new StateManager();
var ActivityLoader = /** @class */ (function (_super) {
    __extends(ActivityLoader, _super);
    function ActivityLoader() {
        return _super.call(this) || this;
    }
    ActivityLoader.prototype.createdCallback = function () {
        this.bar = document.createElement("activity-loader-bar");
    };
    ActivityLoader.prototype.attachedCallback = function () {
        this.appendChild(this.bar);
        this.className = "hidden";
    };
    ActivityLoader.prototype.show = function () {
        this.className = "";
        this.bar.className = "animate";
    };
    ActivityLoader.prototype.hide = function () {
        this.bar.className = "";
        this.className = "hidden";
    };
    return ActivityLoader;
}(HTMLElement));
document.registerElement("activity-loader", ActivityLoader);
var ActivityLoaderBar = /** @class */ (function (_super) {
    __extends(ActivityLoaderBar, _super);
    function ActivityLoaderBar() {
        return _super.call(this) || this;
    }
    return ActivityLoaderBar;
}(HTMLDivElement));
document.registerElement("activity-loader-bar", ActivityLoaderBar);
var AppButton = /** @class */ (function (_super) {
    __extends(AppButton, _super);
    function AppButton() {
        return _super.call(this) || this;
    }
    AppButton.prototype.attachedCallback = function () {
        this.redraw();
    };
    AppButton.prototype.redraw = function () {
        this.clear();
        this.draw();
    };
    // Clear out the current button content.
    AppButton.prototype.clear = function () {
        var existing = this.children;
        while (existing[0])
            existing[0].parentNode.removeChild(existing[0]);
    };
    // Draw out the current button content
    AppButton.prototype.draw = function () {
        if (this.iconName !== undefined && this.iconName !== "") {
            this.icon = document.createElement('i');
            this.icon.className += "icon " + this.iconName;
            this.appendChild(this.icon);
        }
        if (this.iconOnly !== true) {
            this.text = document.createElement('span');
            this.text.textContent = this.buttonText;
            this.appendChild(this.text);
        }
        else {
            this.className += ' iconOnly';
        }
        this.bindClick();
    };
    AppButton.prototype.bindClick = function () {
        this.onclick = this.event;
    };
    return AppButton;
}(HTMLSpanElement));
document.registerElement('app-button', AppButton);
var ButtonBarButton = /** @class */ (function (_super) {
    __extends(ButtonBarButton, _super);
    function ButtonBarButton() {
        return _super.call(this) || this;
    }
    ButtonBarButton.prototype.attachedCallback = function () {
        _super.prototype.redraw.call(this);
        // Allow individual buttons to have their classes controlled by the setup.
        if (this.isPositive)
            this.classList.add("btn-positive");
        if (this.isNegative)
            this.classList.add("btn-negative");
        if (this.isBack)
            this.classList.add("btn-back");
        this.bindClick();
    };
    ButtonBarButton.prototype.bindClick = function () {
        var _this = this;
        this.onclick = function () { AppManager.executeFunction(_this.event); };
    };
    return ButtonBarButton;
}(AppButton));
document.registerElement('button-bar-button', ButtonBarButton);
var ButtonBarButtonActions = /** @class */ (function () {
    function ButtonBarButtonActions() {
    }
    ButtonBarButtonActions.logout = function () {
        // Confirm the logout first.
        AppManager.popup({
            type: "OKCANCEL",
            titleText: "Confirm",
            messageText: "Logout?",
            actions: [function () {
                    AppManager.reset();
                    window.navigationManager.goToPage(PageConfig.Login);
                }]
        });
    };
    ButtonBarButtonActions.jobs = function () {
        window.navigationManager.goToPage(PageConfig.Jobs);
    };
    return ButtonBarButtonActions;
}());
var RefreshButton = /** @class */ (function (_super) {
    __extends(RefreshButton, _super);
    function RefreshButton() {
        return _super.call(this) || this;
    }
    RefreshButton.prototype.attachedCallback = function () {
        this.createButton();
    };
    RefreshButton.prototype.createButton = function () {
        this.text = document.createElement('span');
        this.text.textContent = this.buttonText;
        this.appendChild(this.text);
        this.bindClick();
    };
    RefreshButton.prototype.bindClick = function () {
        this.onclick = this.event;
    };
    return RefreshButton;
}(HTMLSpanElement));
document.registerElement('refresh-button', RefreshButton);
// class ContextMenu extends HTMLElement {
//     buttons: ContextMenuButton[];
//     constructor() {
//         super();
//     }
//     createdCallback(): void {
//         this.buttons = [];
//         var menu = <ContextMenuButton>document.createElement('context-menu-button');
//         menu.iconName = 'home';
//         menu.buttonText = 'home';
//         menu.event = ContextMenuFunctions.home;
//         this.buttons.push(menu);
//         var phone = <ContextMenuButton>document.createElement('context-menu-button');
//         phone.iconName = 'phone';
//         phone.buttonText = 'phone';
//         this.buttons.push(phone);
//         var photos = <ContextMenuButton>document.createElement('context-menu-button');
//         photos.iconName = 'camera';
//         photos.buttonText = 'photos';
//         this.buttons.push(photos);
//         var settings = <ContextMenuButton>document.createElement('context-menu-button');
//         settings.iconName = 'settings';
//         settings.buttonText = 'settings';
//         this.buttons.push(settings);
//         var close = <ContextMenuButton>document.createElement('context-menu-button');
//         close.iconName = 'cross';
//         close.buttonText = 'close menu';
//         close.event = ContextMenuFunctions.close;
//         this.buttons.push(close);
//         var version = <ContextMenuButton>document.createElement('context-menu-button');
//         version.iconName = 'version';
//         version.buttonText = window.appManager.version;
//         this.buttons.push(version);
//     }
//     attachedCallback(): void {
//         for (var i = 0; i < this.buttons.length; i++) {
//             this.appendChild(this.buttons[i]);
//         }
//         document.onclick = ContextMenuFunctions.close;
//     }
// }
// class ContextMenuFunctions {
//     static close(e: any): void {
//         var contextMenu = window.jmfw('context-menu')[0];
//         var button = window.jmfw('app-header-button.context')[0];
//         if (e.srcElement !== contextMenu && e.srcElement !== button) {
//             window.jmfw(contextMenu).remove();
//             document.onclick = null;
//         }
//     }
//     static home(): void {
//         var page = {
//             actionType: 'navigate',
//             actionOptions: {
//                 name: 'MainMenu',
//                 tagName: 'main-menu-page'
//             }
//         }
//         window.navigationManager.goToPage(page);
//     }
// }
// document.registerElement('context-menu', ContextMenu); 
var ButtonBar = /** @class */ (function (_super) {
    __extends(ButtonBar, _super);
    function ButtonBar() {
        return _super.call(this) || this;
    }
    ButtonBar.prototype.createdCallback = function () {
        this.show = true;
        this.buttons = [];
    };
    ButtonBar.prototype.attachedCallback = function () {
        var _this = this;
        if (Array.isArray(this.buttons) && this.buttons.length > 0) {
            this.buttons.forEach(function (btn) {
                var button = document.createElement('button-bar-button');
                button.iconName = btn.iconName;
                button.iconOnly = btn.iconOnly || false;
                button.buttonText = btn.buttonText || '';
                button.event = btn.event;
                button.isPositive = btn.isPositive;
                button.isNegative = btn.isNegative;
                button.isBack = btn.isBack;
                _this.appendChild(button);
            });
        }
    };
    return ButtonBar;
}(HTMLElement));
document.registerElement('button-bar', ButtonBar);
var CommentsSection = /** @class */ (function (_super) {
    __extends(CommentsSection, _super);
    function CommentsSection() {
        return _super.call(this) || this;
    }
    CommentsSection.prototype.createdCallback = function () {
    };
    CommentsSection.prototype.attachedCallback = function () {
        this.clear();
        this.draw();
    };
    CommentsSection.prototype.clear = function () {
        var children = this.childNodes;
        while (children[0])
            children[0].parentNode.removeChild(children[0]);
    };
    CommentsSection.prototype.draw = function () {
        var customerCommentsHeader = document.createElement("div");
        customerCommentsHeader.className = "customer-comments-header";
        customerCommentsHeader.textContent = this.title || "Comments";
        this.appendChild(customerCommentsHeader);
        var customerCommentsText = document.createElement("div");
        customerCommentsText.className = "customer-comments-text";
        customerCommentsText.textContent = this.comments;
        this.appendChild(customerCommentsText);
    };
    return CommentsSection;
}(HTMLDivElement));
document.registerElement('comments-section', CommentsSection);
var AppDisplayHeader = /** @class */ (function (_super) {
    __extends(AppDisplayHeader, _super);
    function AppDisplayHeader() {
        return _super.call(this) || this;
    }
    AppDisplayHeader.prototype.createdCallback = function () {
    };
    // Draws a header like:
    // --------------------------------------------------------
    // |               _____________________________________  |
    // |  ___________ | __________________    ____________  | |
    // | |          | || appHeader        |  |           |  | |
    // | | leftLogo | || appSubHeader     |  | rightLogo |  | |
    // | |__________| ||__________________|  |___________|  | |
    // |              |_____________________________________| |
    // |______________________________________________________|
    AppDisplayHeader.prototype.attachedCallback = function () {
        if (this.leftLogo !== undefined) {
            var leftLogoEl = document.createElement("app-header-logo");
            leftLogoEl.src = PageConfig[this.pageName].leftLogo;
            leftLogoEl.className = "leftLogo";
            this.appendChild(leftLogoEl);
        }
        var hangRightEl = document.createElement("span");
        hangRightEl.className = "hangRight";
        var appHeader = document.createElement("span");
        if (this.headerText !== undefined) {
            var headerEl = document.createElement("app-header-text");
            headerEl.textContent = this.headerText;
            appHeader.appendChild(headerEl);
        }
        if (this.subHeaderText !== undefined) {
            var subHeaderEl = document.createElement("app-header-text");
            subHeaderEl.className = "subHeader";
            subHeaderEl.textContent = this.subHeaderText;
            appHeader.appendChild(subHeaderEl);
        }
        hangRightEl.appendChild(appHeader);
        if (this.rightLogo !== undefined) {
            var rightLogoEl = document.createElement("app-header-logo");
            rightLogoEl.src = PageConfig[this.pageName].leftLogo;
            rightLogoEl.className = "rightLogo";
            hangRightEl.appendChild(rightLogoEl);
        }
        this.appendChild(hangRightEl);
    };
    return AppDisplayHeader;
}(HTMLElement));
var DisplayHeaderLogo = /** @class */ (function (_super) {
    __extends(DisplayHeaderLogo, _super);
    function DisplayHeaderLogo() {
        return _super.call(this) || this;
    }
    return DisplayHeaderLogo;
}(HTMLImageElement));
var DisplayHeaderText = /** @class */ (function (_super) {
    __extends(DisplayHeaderText, _super);
    function DisplayHeaderText() {
        return _super.call(this) || this;
    }
    return DisplayHeaderText;
}(HTMLSpanElement));
var DisplayHeaderBar = /** @class */ (function (_super) {
    __extends(DisplayHeaderBar, _super);
    function DisplayHeaderBar() {
        return _super.call(this) || this;
    }
    return DisplayHeaderBar;
}(HTMLElement));
document.registerElement("app-display-header", AppDisplayHeader);
document.registerElement("app-display-header-logo", DisplayHeaderLogo);
document.registerElement("app-display-header-text", DisplayHeaderText);
document.registerElement("app-display-header-bar", DisplayHeaderBar);
var ErrorBlock = /** @class */ (function (_super) {
    __extends(ErrorBlock, _super);
    function ErrorBlock() {
        return _super.call(this) || this;
    }
    ErrorBlock.prototype.createdCallback = function () {
    };
    ErrorBlock.prototype.attachedCallback = function () {
        if (!this.error.hasOwnProperty("text")) {
            window.logManager.log("Attempted to create ErrorBlock without a valid error object.", "", "ERROR");
            return;
        }
        this.errorText = this.error["text"];
        var errorBlock = document.createElement("div"), errorSpan = document.createElement("span");
        errorSpan.textContent = this.errorText;
        errorBlock.appendChild(errorSpan);
        this.appendChild(errorBlock);
    };
    return ErrorBlock;
}(HTMLElement));
document.registerElement('error-block', ErrorBlock);
var JobsList = /** @class */ (function (_super) {
    __extends(JobsList, _super);
    function JobsList() {
        return _super.call(this) || this;
    }
    return JobsList;
}(HTMLDivElement));
document.registerElement("jobs-list", JobsList);
var DateHeader = /** @class */ (function (_super) {
    __extends(DateHeader, _super);
    function DateHeader() {
        return _super.call(this) || this;
    }
    DateHeader.prototype.attachedCallback = function () {
        // Job Date
        var dateEl = document.createElement("span");
        dateEl.className = "job-date";
        if (this.date.isSame(moment(), "day")) {
            dateEl.textContent = "Today's Jobs";
        }
        else {
            dateEl.textContent = Helper._dates_format(this.date, "Do MMM YYYY");
        }
        this.appendChild(dateEl);
    };
    return DateHeader;
}(HTMLDivElement));
document.registerElement("date-header", DateHeader);
var JobListElement = /** @class */ (function (_super) {
    __extends(JobListElement, _super);
    function JobListElement() {
        return _super.call(this) || this;
    }
    JobListElement.prototype.createdCallback = function () {
        this.driverStatus = "";
        this.event = function () { };
    };
    JobListElement.prototype.attachedCallback = function () {
        // Job Status
        this.className = "job-status status-" + this.driverStatus.toLowerCase();
        // Job Time
        var timeEl = document.createElement("div");
        timeEl.className = "job-time";
        var desiredTime = document.createElement("span");
        desiredTime.className = "desired-time";
        desiredTime.textContent = this.time;
        timeEl.appendChild(desiredTime);
        if (!Helper._undefinedNullOrEmptyString(this.eta)) {
            var eta = document.createElement("span");
            eta.className = "eta";
            eta.textContent = "ETA " + this.eta;
            timeEl.appendChild(eta);
        }
        this.appendChild(timeEl);
        // Job Description
        var descriptionEl = document.createElement("span");
        descriptionEl.className = "job-description";
        var descriptionHeaderEl = document.createElement("span");
        descriptionHeaderEl.className = "job-description-header";
        descriptionHeaderEl.textContent = this.descriptionHeader;
        descriptionEl.appendChild(descriptionHeaderEl);
        var contractEl = document.createElement("span");
        contractEl.className = "job-contract-name";
        contractEl.textContent = this.contractName;
        descriptionEl.appendChild(contractEl);
        var serviceEl = document.createElement("span");
        serviceEl.className = "job-service";
        serviceEl.textContent = this.service;
        descriptionEl.appendChild(serviceEl);
        var descriptionTextEl = document.createElement("span");
        descriptionTextEl.className = "job-description-text";
        descriptionTextEl.textContent = this.descriptionText;
        descriptionEl.appendChild(descriptionTextEl);
        this.appendChild(descriptionEl);
        var statusIndicator = "";
        switch (this.driverStatus) {
            case CONSTANTS.JOB_STATUS.NO_DRIVER.identifier:
                statusIndicator = "[No Driver]";
                break;
            case CONSTANTS.JOB_STATUS.UNASSIGNED.identifier:
                statusIndicator = "[Unassigned]";
                break;
            case CONSTANTS.JOB_STATUS.PENDING.identifier:
                statusIndicator = "[Pending]";
                break;
            case CONSTANTS.JOB_STATUS.ACCEPTED.identifier:
                statusIndicator = "[Accepted]";
                break;
            case CONSTANTS.JOB_STATUS.INITIATED.identifier:
                statusIndicator = "[Started]";
                break;
            case CONSTANTS.JOB_STATUS.FAILED.identifier:
                statusIndicator = "[Failed]";
                break;
            case CONSTANTS.JOB_STATUS.COMPLETE.identifier:
                statusIndicator = "[Complete]";
                break;
            case CONSTANTS.JOB_STATUS.SERVICED.identifier:
                statusIndicator = "[Serviced]";
                break;
            default:
                break;
        }
        var jobStatusIndicatorEl = document.createElement("span");
        jobStatusIndicatorEl.className = "job-status-indicator";
        jobStatusIndicatorEl.textContent = statusIndicator;
        descriptionEl.appendChild(jobStatusIndicatorEl);
        this.appendChild(jobStatusIndicatorEl);
        this.bindClick();
    };
    JobListElement.prototype.bindClick = function () {
        var _this = this;
        this.onclick = function () {
            window.dataManager.setItem("currentJobId", _this.id);
            // Navigate to the main job page and load the full job data
            window.navigationManager.goToPage(PageConfig.Job);
        };
    };
    return JobListElement;
}(HTMLElement));
document.registerElement("job-list-element", JobListElement);
var JobSummary = /** @class */ (function (_super) {
    __extends(JobSummary, _super);
    function JobSummary() {
        return _super.call(this) || this;
    }
    JobSummary.prototype.createdCallback = function () {
        this.job = Job.getCurrentJob();
    };
    JobSummary.prototype.attachedCallback = function () {
        this.clear();
        this.draw();
    };
    JobSummary.prototype.clear = function () {
        var children = this.childNodes;
        while (children[0])
            children[0].parentNode.removeChild(children[0]);
    };
    JobSummary.prototype.draw = function () {
        var _this = this;
        // Main Info section.
        //..
        var mainInfo = document.createElement("div");
        mainInfo.className = "main-info header";
        var time = document.createElement("div");
        time.className = "time";
        time.textContent = this.job.outputTimeString();
        mainInfo.appendChild(time);
        var bookingRef = document.createElement("div");
        bookingRef.className = "booking-ref";
        bookingRef.textContent = "Ref: " + this.job.bookingRef;
        mainInfo.appendChild(bookingRef);
        this.appendChild(mainInfo);
        // Job Info section.
        //...
        var jobInfo = window.printManager.outputJobDetails(this.job);
        jobInfo.className = "job-info";
        this.appendChild(jobInfo);
        // If the job has been started, display the Service Amendments button.
        if (this.job.isStarted()) {
            // Service amendment button (opens up a popup for detail).
            var serviceAmendmentButton = document.createElement("app-button");
            serviceAmendmentButton.buttonText = (Helper._undefinedNullOrEmptyString(this.job.serviceAmendments) ? "Add" : "Update") + " Service Amendment";
            serviceAmendmentButton.className = "secondary-button";
            serviceAmendmentButton.event = function () {
                AppManager.popup({
                    type: "SUBMITCANCEL",
                    titleText: "Service Amendment",
                    messageText: "Please enter details.",
                    inputs: [{
                            id: "serviceAmendment",
                            name: "serviceAmendment",
                            type: CONSTANTS.POPUP_INPUT_TYPE.TEXTAREA,
                            value: _this.job.serviceAmendments
                        }],
                    actions: [function () {
                            var j = Job.getCurrentJob();
                            j.serviceAmendments = window.jQuery("#serviceAmendment").val();
                            j.save();
                            _this.job = j;
                            _this.clear();
                            _this.draw();
                        }]
                });
            };
            this.appendChild(serviceAmendmentButton);
        }
    };
    return JobSummary;
}(HTMLElement));
document.registerElement('job-summary', JobSummary);
var MainContainer = /** @class */ (function (_super) {
    __extends(MainContainer, _super);
    function MainContainer() {
        return _super.call(this) || this;
    }
    MainContainer.prototype.createcCallback = function () {
    };
    MainContainer.prototype.attachedCallback = function () {
    };
    MainContainer.prototype.attributeChangedCallback = function () {
    };
    return MainContainer;
}(HTMLDivElement));
document.registerElement('main-container', MainContainer);
var TitleBar = /** @class */ (function (_super) {
    __extends(TitleBar, _super);
    function TitleBar() {
        return _super.call(this) || this;
    }
    TitleBar.prototype.createdCallback = function () { };
    TitleBar.prototype.attachedCallback = function () {
        var _this = this;
        this.clicks = 0;
        var leftButton = document.createElement('button-bar-button');
        leftButton.iconOnly = false;
        leftButton.buttonText = '';
        if (Array.isArray(this.buttons) && this.buttons[0] !== undefined) {
            var btnToAdd = this.buttons[0];
            leftButton.iconName = btnToAdd.iconName;
            leftButton.iconOnly = btnToAdd.iconOnly || false;
            leftButton.buttonText = btnToAdd.buttonText || '';
            leftButton.event = btnToAdd.event;
        }
        this.appendChild(leftButton);
        if (this.barText) {
            this.titleBarText = document.createElement('div');
            this.titleBarText.textContent = this.barText;
            // Add some hidden functionality...
            this.addEventListener('click', function (e) {
                _this.clicks++;
                if (_this.clicks >= options.hiddenMenuClickLimit) {
                    return (_this.clicks = 0), AppManager.showHiddenMenu();
                }
            }, true);
            this.appendChild(this.titleBarText);
        }
        var rightButton = document.createElement('button-bar-button');
        rightButton.iconOnly = false;
        rightButton.buttonText = '';
        if (Array.isArray(this.buttons) && this.buttons[1] !== undefined) {
            var btnToAdd = this.buttons[1];
            rightButton.iconName = btnToAdd.iconName;
            rightButton.iconOnly = btnToAdd.iconOnly || false;
            rightButton.buttonText = btnToAdd.buttonText || '';
            rightButton.event = btnToAdd.event;
        }
        this.appendChild(rightButton);
    };
    return TitleBar;
}(HTMLElement));
document.registerElement('title-bar', TitleBar);
var BasePanel = /** @class */ (function (_super) {
    __extends(BasePanel, _super);
    function BasePanel() {
        return _super.call(this) || this;
    }
    return BasePanel;
}(HTMLElement));
document.registerElement('base-panel', BasePanel);
var PhotoPanel = /** @class */ (function (_super) {
    __extends(PhotoPanel, _super);
    function PhotoPanel() {
        return _super.call(this) || this;
    }
    PhotoPanel.prototype.createdCallback = function () {
    };
    PhotoPanel.prototype.attachedCallback = function () {
        this.id = this.photo.id;
        this.createPanel();
    };
    PhotoPanel.prototype.createPanel = function () {
        var _this = this;
        if (this.photo !== undefined) {
            this.panelImage = document.createElement('img');
            this.panelImage.src = this.photo.src;
            this.appendChild(this.panelImage);
        }
        // If this photo is deleteable, add the delete icon and its click to delete method
        if (this.deleteable) {
            this.icon = document.createElement('i');
            this.icon.className = "icon " + this.panelIcon;
            this.icon.onclick = function () {
                AppManager.popup({
                    type: "OKCANCEL",
                    titleText: "Confirm",
                    messageText: "Delete photo?",
                    actions: [function () { _this.deleteAction(_this.photo); }]
                });
            };
            this.appendChild(this.icon);
        }
    };
    return PhotoPanel;
}(BasePanel));
document.registerElement('photo-panel', PhotoPanel);
var BaseAppPage = /** @class */ (function (_super) {
    __extends(BaseAppPage, _super);
    function BaseAppPage() {
        return _super.call(this) || this;
    }
    BaseAppPage.prototype.createdCallback = function () {
        this.activityLoader = this.createActivityLoader();
    };
    BaseAppPage.prototype.attachedCallback = function () {
        this.pageName = this.getAttribute('pageName');
        this.createPage(PageConfig[this.pageName]);
    };
    BaseAppPage.prototype.createPage = function (page) {
        this.createBody(page);
        this.appendChild(this.activityLoader);
        this.activityLoader.hide();
        window.screenManager.setOrientation(page.orientation);
        window.navigationManager.pushPage(this);
    };
    BaseAppPage.prototype.createBody = function (page) {
        this.outerBody = document.createElement('div');
        this.outerBody.className += 'outer';
        this.innerBody = document.createElement('div');
        this.innerBody.className += 'inner';
        // Add the title bar if we've got one
        if (page.barText !== undefined || page.header !== undefined) {
            var titleBar = document.createElement("title-bar");
            if (page.header !== undefined && page.header.buttons !== undefined)
                titleBar.buttons = page.header.buttons || [];
            if (page.barText !== undefined)
                titleBar.barText = page.barText;
            this.innerBody.appendChild(titleBar);
        }
        this.outerBody.appendChild(this.innerBody);
        this.appendChild(this.outerBody);
        if (page.footer !== undefined)
            this.createButtonBar("footer", page.footer, this.innerBody);
    };
    BaseAppPage.prototype.createButtonBar = function (element, bar, onto) {
        if (bar.show === undefined || bar.show) {
            this[element] = document.createElement('button-bar');
            this[element].className = element;
            this[element].buttons = bar.buttons;
            onto.appendChild(this[element]);
        }
    };
    BaseAppPage.prototype.createActivityLoader = function () {
        this.activityLoader = document.createElement('activity-loader');
        return this.activityLoader;
    };
    BaseAppPage.prototype.unloadPage = function () {
        window.jmfw(this).remove();
    };
    return BaseAppPage;
}(HTMLElement));
document.registerElement('app-page', BaseAppPage);
var BreakdownPage = /** @class */ (function (_super) {
    __extends(BreakdownPage, _super);
    function BreakdownPage() {
        return _super.call(this) || this;
    }
    BreakdownPage.prototype.createdCallback = function () {
        this.activityLoader = _super.prototype.createActivityLoader.call(this);
        this.job = Job.getCurrentJob();
    };
    BreakdownPage.prototype.attachedCallback = function () {
        var page = this.getAttribute('pageName');
        this.pageName = page;
        var pageObject = PageConfig[page];
        // Do some manipulation on on the default page setup here based on the current job status.
        // In this instance, we need to swap the Cancel / Confirm buttons out for a single OK button that doesn't do anything if the driver has already signed
        // the breakdown off.
        if (this.job.isDriverSigned()) {
            pageObject = {
                name: pageObject.name,
                tagName: pageObject.tagName,
                barText: pageObject.barText,
                header: pageObject.header,
                footer: {
                    buttons: [{
                            buttonText: "OK",
                            event: "Job.goCurrentJob"
                        }]
                }
            };
        }
        _super.prototype.createPage.call(this, pageObject);
        if (this.job !== null)
            this.draw(this.innerBody);
    };
    BreakdownPage.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        switch (attrName.toLowerCase()) {
            case "job":
                this.job = Job.getCurrentJob();
                this.clear();
                this.draw(this.innerBody);
                break;
            default:
                break;
        }
    };
    // Remove the current job-details and footer bar to make way for the new ones
    BreakdownPage.prototype.clear = function () {
        var mainContainer = this.innerBody.getElementsByTagName("main-container");
        while (mainContainer[0])
            mainContainer[0].parentNode.removeChild(mainContainer[0]);
    };
    // Draw out the current job
    BreakdownPage.prototype.draw = function (onto) {
        var _this = this;
        // Job summary (separate container)
        var mainContainer = document.createElement("main-container"), jobSummary = document.createElement("job-summary");
        mainContainer.appendChild(jobSummary);
        // Form container
        var containerCentered = document.createElement("div");
        containerCentered.className = "container-centered";
        // Waste types section
        var header = document.createElement("div");
        header.className = "header";
        header.textContent = "Waste Streams";
        containerCentered.appendChild(header);
        var infoText = document.createElement("div");
        infoText.className = "intro-text";
        infoText.textContent = "Please indicate the waste percentage breakdown from the visual inspection of the waste.";
        containerCentered.appendChild(infoText);
        // Add label here if user cannot edit value.
        if (this.job.isDriverSigned()) {
            var signedOff = document.createElement("div");
            signedOff.className = "signed-off";
            signedOff.textContent = "Job has been signed off by the driver, breakdowns are no longer editable.";
            containerCentered.appendChild(signedOff);
        }
        // Add an instance for each relevant waste type - we'll need some kind of cross-reference per job here, or perhaps it could come from the job itself. We'll see.
        var wasteTypesList = document.createElement("div");
        wasteTypesList.className = "waste-entry-list";
        this.job.streams.forEach(function (wasteType) {
            // If the job already has a value for this measurement then use that, otherwise use the default.
            var existingValue = wasteType.value, wasteEntryValue = !Helper._undefinedNullOrNaN(existingValue) ? existingValue : wasteType.defaultPercentage;
            var wasteEntry = document.createElement("div");
            wasteEntry.className = "waste-entry";
            wasteEntry.id = wasteType.streamId;
            var wasteEntryHeader = document.createElement("span");
            wasteEntryHeader.className = "waste-entry-header";
            wasteEntryHeader.textContent = wasteType.name;
            wasteEntry.appendChild(wasteEntryHeader);
            var wasteEntryDisplay = document.createElement("span");
            wasteEntryDisplay.className = "waste-entry-std";
            wasteEntryDisplay.textContent = wasteEntryValue + "%";
            wasteEntry.appendChild(wasteEntryDisplay);
            // Input elements, used when the display element is clicked on
            var wasteEntryInput = document.createElement("input");
            wasteEntryInput.type = "number";
            wasteEntryInput.className = "waste-entry-input hidden";
            wasteEntryInput.value = wasteEntryValue.toString();
            wasteEntry.appendChild(wasteEntryInput);
            var wasteEntryUnitDisplay = document.createElement("span");
            wasteEntryUnitDisplay.className = "waste-entry-unit hidden";
            wasteEntryUnitDisplay.textContent = "%";
            wasteEntry.appendChild(wasteEntryUnitDisplay);
            wasteTypesList.appendChild(wasteEntry);
        });
        containerCentered.appendChild(wasteTypesList);
        // Add label here if user cannot edit value.
        if (!this.job.isDriverSigned()) {
            // Edit button - opens up the inputs above for editing.
            var editWasteTypeButton = document.createElement("app-button");
            editWasteTypeButton.buttonText = "Edit Breakdowns";
            editWasteTypeButton.id = "breakdown-edit";
            editWasteTypeButton.className = "secondary-button";
            editWasteTypeButton.event = function () { _this.allowEdit(true); };
            containerCentered.appendChild(editWasteTypeButton);
            // Done button - confirms the inputs above and stops editing.
            var doneButton = document.createElement("app-button");
            doneButton.id = "breakdown-done";
            doneButton.className = "primary-button hidden";
            doneButton.buttonText = "Done";
            doneButton.event = function () {
                if (!_this.saveBreakdown())
                    return;
                _this.allowEdit(false);
            };
            containerCentered.appendChild(doneButton);
        }
        // Add the specific elements to the main container
        mainContainer.appendChild(containerCentered);
        // Add the main container to the page
        onto.appendChild(mainContainer);
        this.addValidators();
        this.updateRunningTotal();
    };
    BreakdownPage.prototype.addValidators = function () {
        var _this = this;
        window.jQuery(".waste-entry-input").on("propertychange input", function (e) {
            e.target.value = Helper._getValidPercentage(e.target.value, "string");
            // Update the running total.
            _this.updateRunningTotal();
        });
    };
    // Set the screen to allow the breakdown streams to be edited.
    BreakdownPage.prototype.allowEdit = function (canEdit) {
        var normalDisplay = ".waste-entry-std", editBox = ".waste-entry-input", editUnit = ".waste-entry-unit", editButton = "#breakdown-edit", doneButton = "#breakdown-done";
        // Show hide the normal label display, edit boxes, etc.
        window.jQuery(normalDisplay)[canEdit ? "hide" : "show"]();
        window.jQuery(editBox + "," + editUnit)[canEdit ? "show" : "hide"]();
        // Switch the buttons around.
        window.jQuery(editButton)[canEdit ? "hide" : "show"]();
        window.jQuery(doneButton)[canEdit ? "show" : "hide"]();
    };
    // Update the running total.
    BreakdownPage.prototype.updateRunningTotal = function () {
        var total = 0, editButtonEl = document.getElementById("breakdown-edit"), doneButtonEl = document.getElementById("breakdown-done");
        if (!doneButtonEl || !editButtonEl)
            return;
        // Run through the streams and add up the totals.
        window.jQuery(".waste-entry-input").each(function (index, entry) {
            var streamValue = Number(entry["value"]);
            total += streamValue;
        });
        // If the total is not currently 100%, reflect this.
        if (total !== 100) {
            var btnText = "Current Total: " + total + "%";
            editButtonEl.classList.add("negative-button");
            editButtonEl.classList.remove("secondary-button");
            editButtonEl.buttonText = btnText;
            doneButtonEl.classList.add("negative-button");
            doneButtonEl.classList.remove("primary-button");
            doneButtonEl.buttonText = btnText;
        }
        else {
            editButtonEl.classList.remove("negative-button");
            editButtonEl.classList.add("secondary-button");
            editButtonEl.buttonText = "Edit Breakdowns";
            doneButtonEl.classList.remove("negative-button");
            doneButtonEl.classList.add("primary-button");
            doneButtonEl.buttonText = "Done";
        }
        doneButtonEl.redraw();
    };
    // Run any validation against the streams.
    BreakdownPage.prototype.validateStreams = function (suppress) {
        var total = 0, errorMsg = "";
        // Run through the streams and add up the totals.
        window.jQuery(".waste-entry-input").each(function (index, entry) {
            total += Number(entry["value"]);
        });
        // Total must add up to 100%
        if (total !== 100)
            errorMsg = "Total breakdown must add up to 100%.";
        // More checks if necessary here...
        //...
        //...
        if (errorMsg !== "") {
            AppManager.popup({
                titleText: "Breakdown Error",
                messageText: errorMsg,
                type: "OK"
            });
            return false;
        }
        return true;
    };
    // Save the details against the current job
    BreakdownPage.prototype.saveBreakdown = function () {
        var _this = this;
        if (!this.validateStreams())
            return false;
        window.jQuery(".waste-entry-input").each(function (index, entry) {
            _this.job.setStream(entry.parentElement.id, entry["value"]);
        });
        AppManager.updatePageAttribute(PageConfig.Breakdown.tagName, "job", this.job);
        return true;
    };
    BreakdownPage.prototype.breakdownSubmit = function () {
        if (!this.saveBreakdown())
            return;
        this.job.hasCheckedStreams = true;
        this.job.save();
        Job.completeJob();
    };
    BreakdownPage.prototype.back = function () {
        // If we're collecting measurements, go back there, otherwise, go current job.
        if (!Helper._undefinedNullOrEmptyString(this.job.requiredMeasurement)) {
            window.navigationManager.goToPage(PageConfig.Measurements);
        }
        else {
            Job.goCurrentJob();
        }
    };
    // Expose the back function.
    BreakdownPage.back = function () {
        window.jmfw(PageConfig.Breakdown.tagName)[0].back();
    };
    BreakdownPage.breakdownSubmit = function () {
        window.jmfw(PageConfig.Breakdown.tagName)[0].breakdownSubmit();
    };
    return BreakdownPage;
}(BaseAppPage));
document.registerElement(PageConfig.Breakdown.tagName, BreakdownPage);
var FailPage = /** @class */ (function (_super) {
    __extends(FailPage, _super);
    function FailPage() {
        return _super.call(this) || this;
    }
    FailPage.prototype.createdCallback = function () {
        this.activityLoader = _super.prototype.createActivityLoader.call(this);
        this.job = Job.getCurrentJob();
        this.failureReasons = CONSTANTS.FAIL.FAILURE_REASONS;
    };
    FailPage.prototype.attachedCallback = function () {
        var page = this.getAttribute('pageName');
        this.pageName = page;
        _super.prototype.createPage.call(this, PageConfig[page]);
        if (this.job !== null)
            this.draw(this.innerBody);
    };
    FailPage.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        switch (attrName.toLowerCase()) {
            case "job":
                this.job = Job.getCurrentJob();
                this.clear();
                this.draw(this.innerBody);
                break;
            default:
                break;
        }
    };
    // Remove the current job-details and footer bar to make way for the new ones
    FailPage.prototype.clear = function () {
        var mainContainer = this.innerBody.getElementsByTagName("main-container");
        while (mainContainer[0])
            mainContainer[0].parentNode.removeChild(mainContainer[0]);
    };
    // Draw out the current job
    FailPage.prototype.draw = function (onto) {
        var _this = this;
        // Job summary (separate container)
        var mainContainer = document.createElement("main-container"), jobSummary = document.createElement("job-summary");
        mainContainer.appendChild(jobSummary);
        // Form container
        var containerCentered = document.createElement("div");
        containerCentered.className = "container-centered";
        // Form header
        var header = document.createElement("div");
        header.className = "header";
        header.textContent = "Failure Details";
        containerCentered.appendChild(header);
        // Select element
        var failureReasonSelect = document.createElement("select");
        failureReasonSelect.id = "failure-reason";
        // Add initial blank option
        var option = document.createElement("option");
        option.text = "";
        option.value = "";
        failureReasonSelect.appendChild(option);
        this.failureReasons.forEach(function (r) {
            var option = document.createElement("option");
            option.text = r.reason;
            option.value = r.reason;
            failureReasonSelect.appendChild(option);
        });
        // Get the currently selected value - if it requires a photo, display the photo option.
        failureReasonSelect.onchange = function () {
            var v = failureReasonSelect[failureReasonSelect.selectedIndex].value;
            var failureReasonObject = Helper._getObjectFromArrayByPropertyValue(_this.failureReasons, "reason", v);
            // Show / hide the photo option.
            var showHide = failureReasonObject && failureReasonObject.requiresPhoto ? "show" : "hide", photoElements = window.jQuery(".photo-button,.photo-area");
            // Make sure we hide the photo buttons and any existing photos.
            // TODO: We might choose to remove any photos that have been taken if no longer needed.
            if (!Helper._undefinedOrNull(photoElements))
                photoElements[showHide]();
        };
        // Label
        var failureReasonLabel = document.createElement("label");
        failureReasonLabel.htmlFor = failureReasonSelect.id;
        failureReasonLabel.textContent = "Failure Reason";
        // Photo section
        //
        // Hide both buttons to begin with, they'll be displayed if the failure reason requires a supporting photo.
        var takePhotoButton = document.createElement("app-button");
        takePhotoButton.buttonText = "Take Photo";
        takePhotoButton.className = "photo-button";
        takePhotoButton.event = function () {
            if (_this.canAddPhoto())
                window.cameraManager.startCamera(function (p) { _this.addPhoto(p); });
        };
        // If we've got any existing photos, chuck em on here
        this.photoArea = document.createElement("div");
        this.photoArea.className = "photo-area";
        this.drawPhotos();
        // Add everything to the page
        containerCentered.appendChild(header);
        containerCentered.appendChild(failureReasonLabel);
        containerCentered.appendChild(failureReasonSelect);
        containerCentered.appendChild(this.photoArea);
        containerCentered.appendChild(takePhotoButton);
        // Add the fail-specific elements to the main container
        mainContainer.appendChild(containerCentered);
        // Add the main container to the page
        onto.appendChild(mainContainer);
        // A bit hacky - I want to have the photo section hidden on first load but it needs to display flex
        // when it is displayed. Given that it will begin with display: none, jQuery will save that state
        // and as such, use display: block on show() - which is not what I want.
        // Could use .css() on the jQuery object but I'd rather not mix so instead, I'm going to manually
        // hide the photo section elements here as soon as they've been added to the DOM. Hopefully it
        // won't be visible.
        //
        var photoElements = window.jQuery(".photo-button,.photo-area");
        photoElements.hide();
    };
    FailPage.prototype.canAddPhoto = function () {
        if (this.job.failurePhotos.length < CONSTANTS.FAIL.MAX_FAIL_PHOTOS)
            return true;
        AppManager.popup({
            titleText: "Photo Limit Reached",
            messageText: "Max photos already added - please delete an existing photo to add more.",
            type: "OK"
        });
        return false;
    };
    // Remove the current photos so that they can be redrawn
    FailPage.prototype.clearPhotos = function () {
        var el = this.innerBody.getElementsByTagName("photo-panel");
        while (el[0])
            el[0].parentNode.removeChild(el[0]);
    };
    // Draw out an individual photo
    FailPage.prototype.drawPhoto = function (photo) {
        var photoPanel = document.createElement('photo-panel');
        photoPanel.photo = photo;
        photoPanel.deleteable = true;
        photoPanel.panelIcon = "iconDelete";
        photoPanel.deleteAction = FailPage.removePhoto;
        this.photoArea.appendChild(photoPanel);
    };
    // Loop through all currently saved photos and otuput them
    FailPage.prototype.drawPhotos = function () {
        var _this = this;
        // Clear out any existing photoPanels first
        this.clearPhotos();
        if (Helper._undefinedNullOrEmptyArray(this.job.failurePhotos))
            return null;
        this.job.failurePhotos.forEach(function (photo) {
            window.cameraManager.getPhoto(photo, (function (p) { return _this.drawPhoto(p); }));
        });
    };
    // Save a newly taken / chosen photo against the current job
    FailPage.prototype.addPhoto = function (photo) {
        var _this = this;
        this.job.failurePhotos.push(photo);
        this.job.save();
        // We have the 'basic' photo object, pass it through getPhoto to set the src so it can be used on-screen
        window.cameraManager.getPhoto(photo, function (p) {
            _this.drawPhoto(p);
            CommsManager.showLoader(false);
        });
    };
    // Remove the given photo from the array of photos
    FailPage.prototype.removePhoto = function (photo) {
        this.job = Job.getCurrentJob();
        if (this.job === null)
            return;
        // Hide the photo panel as it's being removed.
        window.jQuery("photo-panel#" + photo.id).hide();
        this.job.failurePhotos = this.job.failurePhotos.filter(function (p) { return p.id !== photo.id; }); // Arrow functions don't need brackets, used this way will return implicitly. Which is cool.
        this.job.save();
        // this.drawPhotos();
    };
    // Attempt to fail the job
    FailPage.prototype.submit = function () {
        this.job.failureReason = Helper._getObjectFromArrayByPropertyValue(this.failureReasons, "reason", window.jmfw("#failure-reason")[0].value);
        this.job.save();
        Job.failJob();
    };
    // Expose the remove photo function.
    FailPage.removePhoto = function (photo) {
        window.jmfw(PageConfig.Fail.tagName)[0].removePhoto(photo);
    };
    // Expose the submit function.
    FailPage.submit = function () {
        window.jmfw(PageConfig.Fail.tagName)[0].submit();
    };
    return FailPage;
}(BaseAppPage));
document.registerElement(PageConfig.Fail.tagName, FailPage);
var JobPage = /** @class */ (function (_super) {
    __extends(JobPage, _super);
    function JobPage() {
        return _super.call(this) || this;
    }
    JobPage.prototype.createdCallback = function () {
        this.activityLoader = _super.prototype.createActivityLoader.call(this);
        // Load the currently selected job from the stored ID
        this.job = Job.getCurrentJob();
        // Add the dynamic footer buttons - these change based on the job's current status
        this.updatePageConfig();
    };
    JobPage.prototype.attachedCallback = function () {
        var page = this.getAttribute('pageName');
        this.pageName = page;
        _super.prototype.createPage.call(this, PageConfig[page]);
        if (this.job !== null)
            this.draw();
    };
    JobPage.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        switch (attrName.toLowerCase()) {
            case "job":
                var jobData = JSON.parse(newVal);
                // Set up the new job data
                this.job = jobData !== undefined ? this.buildJob(jobData) : new Job();
                this.redraw();
                break;
            default:
                break;
        }
    };
    JobPage.prototype.redraw = function () {
        CommsManager.showLoader();
        this.clear();
        this.draw();
        // Redraw the footer bar if the status has changed (to offer the new status buttons)
        this.updatePageConfig();
        _super.prototype.createButtonBar.call(this, "footer", PageConfig.Job.footer, this.innerBody);
        CommsManager.showLoader(false);
    };
    // Remove the current job-details and footer bar to make way for the new ones
    JobPage.prototype.clear = function () {
        // Job details
        var existingJob = this.innerBody.getElementsByTagName("main-container");
        while (existingJob[0])
            existingJob[0].parentNode.removeChild(existingJob[0]);
        // Footer bar
        var footerBar = window.jQuery("#footer");
        if (footerBar !== undefined)
            footerBar.remove();
    };
    // Draw out the current job
    JobPage.prototype.draw = function () {
        var _this = this;
        var mainContainer = document.createElement("main-container");
        var job = document.createElement("job-details");
        var status = document.createElement("div");
        status.className = "status status-" + this.job.driverStatus.toLowerCase();
        status.textContent = CONSTANTS.JOB_STATUS[this.job.driverStatus] !== undefined ? CONSTANTS.JOB_STATUS[this.job.driverStatus].text : "";
        job.appendChild(status);
        var jobSummary = document.createElement("job-summary");
        job.appendChild(jobSummary);
        var addressInfo = document.createElement("div");
        addressInfo.className = "address-info";
        var contractName = document.createElement("div");
        contractName.className = "contract-name";
        contractName.textContent = this.job.contractName;
        addressInfo.appendChild(contractName);
        // Address - the job address
        var address = document.createElement("div");
        address.className = "address";
        address.onclick = function () {
            // Open a popup and offer to view directions in Maps.
            AppManager.popup({
                type: "OKCANCEL",
                titleText: "Directions",
                messageText: "View directions in Maps?",
                actions: [function () { Job.getJobDirections(); }]
            });
        };
        if (this.job.address1 !== undefined && this.job.address1 !== "") {
            var address1 = document.createElement("span");
            address1.className = "address1";
            address1.textContent = this.job.address1 + ",";
            address.appendChild(address1);
        }
        if (this.job.address2 !== undefined && this.job.address2 !== "") {
            var address2 = document.createElement("span");
            address2.className = "address2";
            address2.textContent = this.job.address2 + ",";
            address.appendChild(address2);
        }
        if (this.job.address3 !== undefined && this.job.address3 !== "") {
            var address3 = document.createElement("span");
            address3.className = "address3";
            address3.textContent = this.job.address3 + ",";
            address.appendChild(address3);
        }
        if (this.job.address4 !== undefined && this.job.address4 !== "") {
            var address4 = document.createElement("span");
            address4.className = "address4";
            address4.textContent = this.job.address4 + ",";
            address.appendChild(address4);
        }
        if (this.job.postcode !== undefined && this.job.postcode !== "") {
            var postcode = document.createElement("span");
            postcode.className = "postcode";
            postcode.textContent = this.job.postcode;
            address.appendChild(postcode);
        }
        addressInfo.appendChild(address);
        job.appendChild(addressInfo);
        // Add the generic Reconomy phone number for easy access here.
        var phoneButton = document.createElement("app-button");
        phoneButton.className = "secondary-button main-telephone";
        phoneButton.iconOnly = false;
        phoneButton.iconName = "iconPhone";
        phoneButton.buttonText = CONSTANTS.MAIN_TELEPHONE;
        phoneButton.event = this.mainTelephoneCall();
        job.appendChild(phoneButton);
        // Add the upload photo button.
        var uploadPhotoButton = document.createElement("app-button");
        uploadPhotoButton.buttonText = "Upload Photo";
        uploadPhotoButton.event = function () {
            _this.drawPhotoPopup();
        };
        job.appendChild(uploadPhotoButton);
        mainContainer.appendChild(job);
        this.innerBody.appendChild(mainContainer);
    };
    JobPage.prototype.mainTelephoneCall = function () {
        return window.commsManager.mainTelephoneCall;
    };
    JobPage.prototype.buildJob = function (jobData) {
        var job = new Job(jobData);
        return job;
    };
    // Updates the page config object to cater for the current job status
    JobPage.prototype.updatePageConfig = function () {
        var _this = this;
        // For reference, potential job statuses (and order):
        //   NO DRIVER NEEDED > UNASSIGNED > PENDING > ACCEPTED > INITIATED > FAILED > COMPLETE
        var backwardAction = null, backwardText = "", backwardIcon = "", backwardType = "", forwardAction = null, forwardText = "", forwardIcon = "", forwardType = "";
        switch (this.job.driverStatus) {
            case CONSTANTS.JOB_STATUS.PENDING.identifier:
                backwardAction = "Job.rejectJob";
                backwardText = "Reject";
                backwardType = "negative";
                forwardAction = "Job.acceptJob";
                forwardText = "Accept";
                forwardType = "positive";
                break;
            case CONSTANTS.JOB_STATUS.ACCEPTED.identifier:
                forwardAction = "Job.startJob";
                forwardText = "Start";
                forwardType = "positive";
                break;
            case CONSTANTS.JOB_STATUS.INITIATED.identifier:
                backwardAction = "Job.goFailJob";
                backwardText = "Fail";
                backwardType = "negative";
                forwardAction = "Job.completeJob";
                forwardText = "Serviced";
                forwardType = "positive";
                break;
            case CONSTANTS.JOB_STATUS.SERVICED.identifier:
                // Forward on to the relevant page, depending on how this job is set up - we will always go through this flow.
                forwardAction = function () {
                    if (!Helper._undefinedNullOrEmptyString(_this.job.requiredMeasurement)) {
                        window.navigationManager.goToPage(PageConfig.Measurements);
                    }
                    else if (_this.job.requireStreams) {
                        window.navigationManager.goToPage(PageConfig.Breakdown);
                    }
                    else {
                        Job.completeJob();
                    }
                };
                forwardText = "Continue";
                forwardType = "positive";
                break;
            case CONSTANTS.JOB_STATUS.FAILED.identifier:
                forwardAction = "Job.restartJob";
                forwardText = "Restart";
                break;
            case CONSTANTS.JOB_STATUS.COMPLETE.identifier:
                backwardAction = "Job.restartJob";
                backwardText = "Restart";
                break;
            default:
                backwardAction = "ButtonBarButtonActions.jobs";
                backwardText = "All Jobs";
                break;
        }
        PageConfig.Job.footer.buttons = [];
        if (backwardAction !== null) {
            var backwardButton = {
                show: true,
                iconName: backwardIcon,
                buttonText: backwardText,
                event: backwardAction
            };
            // Set the relevant button type.
            switch (backwardType) {
                case "positive":
                    backwardButton.isPositive = true;
                    break;
                case "negative":
                    backwardButton.isNegative = true;
                    break;
                default:
                    backwardButton.isBack = true;
                    break;
            }
            PageConfig.Job.footer.buttons.push(backwardButton);
        }
        if (forwardAction !== null) {
            var forwardButton = {
                show: true,
                iconName: forwardIcon,
                buttonText: forwardText,
                event: forwardAction
            };
            // Set the relevant button type.
            switch (forwardType) {
                case "positive":
                    forwardButton.isPositive = true;
                    break;
                case "negative":
                    forwardButton.isNegative = true;
                    break;
                default:
                    forwardButton.isBack = true;
                    break;
            }
            PageConfig.Job.footer.buttons.push(forwardButton);
        }
    };
    JobPage.prototype.drawPhotoPopup = function () {
        var _this = this;
        // Photo catpure / display helper functions - this could be done a lot better...
        var canAddPhoto = function () {
            var adhocPhoto = window.dataManager.getItem("adhocPhoto");
            // We can only have one adhoc photo at once...
            if (Helper._undefinedNullOrEmptyString(adhocPhoto))
                return true;
            AppManager.popup({
                titleText: "Photo Limit Reached",
                messageText: "Max photos already added - please delete an existing photo to add more.",
                type: "OK"
            });
            return false;
        }, drawPhoto = function (photo) {
            var photoPanel = document.createElement('photo-panel');
            photoPanel.photo = photo;
            photoPanel.deleteable = true;
            photoPanel.panelIcon = "iconDelete";
            photoPanel.deleteAction = function (p) {
                // Delete the adhoc photo, then clear it down.
                window.dataManager.setItem("adhocPhoto", null);
                // Clear down the existing photo panel.
                var el = document.getElementsByTagName("photo-panel");
                while (el[0])
                    el[0].parentNode.removeChild(el[0]);
            };
            photoArea.appendChild(photoPanel);
        }, addPhoto = function (photo) {
            window.dataManager.setItem("adhocPhoto", photo);
            // We have the 'basic' photo object, pass it through getPhoto to set the src so it can be used on-screen
            window.cameraManager.getPhoto(photo, function (p) {
                drawPhoto(p);
                CommsManager.showLoader(false);
            });
        };
        // Draw the popup out.
        var photoPopupContent = document.createElement("div");
        var takePhotoButton = document.createElement("app-button");
        takePhotoButton.buttonText = "Take Photo";
        takePhotoButton.className = "photo-button";
        takePhotoButton.event = function () {
            if (canAddPhoto())
                window.cameraManager.startCamera(function (p) { return addPhoto(p); });
        };
        // If we've got any existing photos, chuck em on here
        var photoArea = document.createElement("div");
        photoArea.className = "photo-area";
        // Draw the existing photo if we have one (successful upload will clear this, so this is only to retry failed attempts / be able to clear the adhoc photo).
        var adhocPhoto = window.dataManager.getItem("adhocPhoto");
        if (adhocPhoto) {
            CommsManager.showLoader();
            // We have the 'basic' photo object, pass it through getPhoto to set the src so it can be used on-screen
            window.cameraManager.getPhoto(adhocPhoto, function (p) {
                drawPhoto(p);
                CommsManager.showLoader(false);
            });
        }
        photoPopupContent.appendChild(photoArea);
        photoPopupContent.appendChild(takePhotoButton);
        AppManager.popup({
            titleText: "Upload Photo",
            messageText: "",
            contentElement: photoPopupContent,
            type: "SUBMITCANCEL",
            inputs: [{
                    id: "comments",
                    name: "comments",
                    label: "Comments",
                    type: CONSTANTS.POPUP_INPUT_TYPE.TEXT
                }],
            actions: [function () {
                    // Upload the comments and photo to the server.
                    var adhocComments = window.jQuery("#comments").val(), adhocPhoto = window.dataManager.getItem('adhocPhoto');
                    // Grab the full photo attachment and upload.
                    window.cameraManager.getPhoto(adhocPhoto, function (p) {
                        _this.job.adhocPhotos.push(p);
                        _this.job.save();
                        Job.uploadAdhocPhoto(adhocComments, p);
                        window.dataManager.setItem("adhocPhoto", null);
                        _this.redraw();
                        CommsManager.showLoader(false);
                    });
                }],
            validation: function () {
                var adhocPhoto = window.dataManager.getItem('adhocPhoto');
                // Validation
                if (Helper._undefinedOrNull(adhocPhoto)) {
                    AppManager.popup({
                        type: "OK",
                        titleText: "Incomplete",
                        messageText: "Please take a photo."
                    });
                    return false;
                }
                return true;
            },
            isHTML: true,
            order: ["inputs", "content"]
        });
    };
    return JobPage;
}(BaseAppPage));
document.registerElement(PageConfig.Job.tagName, JobPage);
var JobDetails = /** @class */ (function (_super) {
    __extends(JobDetails, _super);
    function JobDetails() {
        return _super.call(this) || this;
    }
    JobDetails.prototype.createcCallback = function () {
    };
    JobDetails.prototype.attachedCallback = function () {
    };
    JobDetails.prototype.attributeChangedCallback = function () {
    };
    return JobDetails;
}(HTMLDivElement));
document.registerElement('job-details', JobDetails);
var JobsPage = /** @class */ (function (_super) {
    __extends(JobsPage, _super);
    function JobsPage() {
        return _super.call(this) || this;
    }
    JobsPage.prototype.createdCallback = function () {
        this.activityLoader = _super.prototype.createActivityLoader.call(this);
    };
    JobsPage.prototype.attachedCallback = function () {
        var page = this.getAttribute("pageName");
        this.pageName = page;
        _super.prototype.createPage.call(this, PageConfig[page]);
        var scroller = document.createElement("div");
        scroller.id = "scroller";
        this.scroller = scroller;
        this.innerBody.appendChild(this.scroller);
        // Run the initial call to get job data if we don't already have data - if we have, jobs will be updated in other ways
        var jobData = window.dataManager.getItem("jobs");
        if (jobData === undefined) {
            Driver.getJobs();
        }
        else {
            this.redraw();
        }
    };
    JobsPage.prototype.redraw = function () {
        CommsManager.showLoader();
        // Ensure we clear any old entries / dates out first before we redraw.
        this.clear();
        this.jobData = window.dataManager.getItem("jobs");
        // Set up the new job data
        this.jobElements = this.jobData !== undefined ? this.buildJobs(this.jobData) : [];
        var jobList = document.createElement("job-list");
        this.draw(jobList);
        this.scroller.appendChild(jobList);
        CommsManager.showLoader(false);
    };
    JobsPage.prototype.clear = function () {
        var existingJobs = this.scroller.getElementsByTagName("job-list");
        while (existingJobs[0])
            existingJobs[0].parentNode.removeChild(existingJobs[0]);
    };
    // Draw out the current list of jobs, adding in date element 'spacer's whenever the date changes.
    JobsPage.prototype.draw = function (scrollOnto) {
        // Firstly, check that we've got some jobs to output.
        if (this.jobElements.length === 0) {
            // Add today header.
            var dateEl = document.createElement("date-header");
            dateEl.date = moment();
            scrollOnto.appendChild(dateEl);
            // Add the no jobs notification.
            var noJobs = document.createElement("div");
            noJobs.className = "no-jobs";
            noJobs.textContent = "No assigned jobs";
            scrollOnto.appendChild(noJobs);
        }
        else {
            var date = null;
            for (var _i = 0, _a = this.jobElements; _i < _a.length; _i++) {
                var job = _a[_i];
                // Start off with a null date and then update it when outputting a new one - so we only output headers when the date changes.
                if (Helper._undefinedOrNull(date) || !date.isSame(job.date, "days")) {
                    var dateEl = document.createElement("date-header");
                    dateEl.date = job.date;
                    scrollOnto.appendChild(dateEl);
                    date = job.date;
                }
                scrollOnto.appendChild(job);
            }
        }
        // Add the last updated time.
        var lastUpdated = document.createElement("div");
        lastUpdated.className = "last-updated";
        lastUpdated.textContent = "Last updated at " + Helper._dates_format(moment(), "HH:mm:ss");
        scrollOnto.appendChild(lastUpdated);
        // Add a manual refresh button.
        var refreshJobsButton = document.createElement("app-button");
        refreshJobsButton.className = "secondary-button";
        refreshJobsButton.buttonText = "Refresh Jobs";
        refreshJobsButton.event = Driver.getJobs;
        scrollOnto.appendChild(refreshJobsButton);
    };
    JobsPage.prototype.buildJobs = function (jobData) {
        var jobList = [];
        jobData.forEach(function (job) {
            var j = new Job(job), newJob = document.createElement("job-list-element");
            newJob.id = j.id;
            newJob.driverStatus = j.driverStatus;
            newJob.date = moment(j.datetime);
            newJob.time = j.outputTimeString();
            newJob.eta = j.eta;
            newJob.contractName = j.contractName;
            newJob.service = j.service;
            newJob.descriptionHeader = j.postcode + " - " + j.companyName;
            newJob.descriptionText = j.movementDesc;
            jobList.push(newJob);
        });
        return jobList;
    };
    JobsPage.redrawJobs = function () {
        window.jmfw(PageConfig.Jobs.tagName)[0].redraw();
    };
    return JobsPage;
}(BaseAppPage));
document.registerElement(PageConfig.Jobs.tagName, JobsPage);
var LoginPage = /** @class */ (function (_super) {
    __extends(LoginPage, _super);
    function LoginPage() {
        return _super.call(this) || this;
    }
    LoginPage.prototype.createdCallback = function () {
        this.activityLoader = _super.prototype.createActivityLoader.call(this);
        // Set the dark background colour as we're on the login page (this is persisted by the nav manager).
        var htmlTag = document.querySelector("html");
        htmlTag.classList.add("dark-bg");
    };
    LoginPage.prototype.attachedCallback = function () {
        var page = this.getAttribute("pageName");
        this.pageName = page;
        _super.prototype.createPage.call(this, PageConfig[page]);
        var imgLogo = document.createElement("img");
        imgLogo.className = "logo";
        imgLogo.src = "./assets/img/reconomy-logo.png";
        this.innerBody.appendChild(imgLogo);
        var appHeader = document.createElement("div");
        appHeader.className = "app-header";
        appHeader.textContent = options.appTag;
        var appSubheader = document.createElement("span");
        appSubheader.className = "app-subheader";
        appSubheader.textContent = options.headerText;
        appHeader.appendChild(appSubheader);
        this.innerBody.appendChild(appHeader);
        var txtUsername = document.createElement("input");
        // Dev only!
        // txtUsername.value = "grahamstone@reconomy.com";
        // Dev only!
        txtUsername.id = "username";
        txtUsername.type = "email";
        txtUsername.placeholder = "User Name";
        this.innerBody.appendChild(txtUsername);
        var txtPassword = document.createElement("input");
        // Dev only!
        // txtPassword.value = "Reconomy1";
        // Dev only!
        txtPassword.id = "password";
        txtPassword.type = "password";
        txtPassword.placeholder = "Password";
        this.innerBody.appendChild(txtPassword);
        var loginButton = document.createElement("app-button");
        loginButton.iconName = null;
        loginButton.className = "primary-button";
        loginButton.buttonText = "Login";
        loginButton.event = this.loginEvent();
        this.innerBody.appendChild(loginButton);
        var copyright = document.createElement("div");
        copyright.className = "copyright";
        copyright.textContent = options.copyrightText;
        this.innerBody.appendChild(copyright);
        var versionDetails = document.createElement("div");
        versionDetails.className = "version-details";
        versionDetails.textContent = options.version;
        // versionDetails.textContent = options.internalVersion;
        this.innerBody.appendChild(versionDetails);
    };
    LoginPage.prototype.loginEvent = function () {
        return Login.login;
    };
    return LoginPage;
}(BaseAppPage));
document.registerElement(PageConfig.Login.tagName, LoginPage);
var MeasurementsPage = /** @class */ (function (_super) {
    __extends(MeasurementsPage, _super);
    function MeasurementsPage() {
        return _super.call(this) || this;
    }
    MeasurementsPage.prototype.createdCallback = function () {
        this.activityLoader = _super.prototype.createActivityLoader.call(this);
        this.job = Job.getCurrentJob();
        this.onRenderred = [];
    };
    MeasurementsPage.prototype.attachedCallback = function () {
        var page = this.getAttribute('pageName');
        this.pageName = page;
        var pageObject = PageConfig[page];
        // Do some manipulation on on the default page setup here based on the current job status.
        // In this instance, we need to swap the Cancel / Confirm buttons out for a single OK button that doesn't do anything if the driver has already signed
        // the measurements off.
        if (this.job.isDriverSigned()) {
            pageObject = {
                name: pageObject.name,
                tagName: pageObject.tagName,
                barText: pageObject.barText,
                header: pageObject.header,
                footer: {
                    buttons: [{
                            buttonText: "OK",
                            event: "Job.completeJob"
                        }]
                }
            };
        }
        _super.prototype.createPage.call(this, pageObject);
        if (this.job !== null)
            this.draw(this.innerBody);
        // Do anything that needed to wait until the page was renderred.
        if (!Helper._undefinedNullOrEmptyArray(this.onRenderred))
            this.onRenderred.forEach(function (f) {
                AppManager.executeFunction(f);
            });
    };
    MeasurementsPage.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
    };
    // Remove the current job-details and footer bar to make way for the new ones
    MeasurementsPage.prototype.clear = function () {
        var mainContainer = this.innerBody.getElementsByTagName("main-container");
        while (mainContainer[0])
            mainContainer[0].parentNode.removeChild(mainContainer[0]);
    };
    // Draw out the current job
    MeasurementsPage.prototype.draw = function (onto) {
        var _this = this;
        var zeroToTen = [];
        for (var i = 0; i <= 9; i++)
            zeroToTen.push(i.toString());
        // Job summary (separate container)
        var mainContainer = document.createElement("main-container"), jobSummary = document.createElement("job-summary");
        mainContainer.appendChild(jobSummary);
        // Form container
        var containerCentered = document.createElement("div");
        containerCentered.className = "container-centered";
        var weightSection = document.createElement("div");
        weightSection.className = "weight-section";
        // Separate designs / inputs for tonnes v. quantity...
        if (this.job.requiredMeasurement === CONSTANTS.MEASUREMENTS.TONNES) {
            // Form header
            var header = document.createElement("div");
            header.className = "header";
            header.textContent = "Weight Detail";
            containerCentered.appendChild(header);
            // Add label here if user cannot edit value.
            if (this.job.isDriverSigned()) {
                var signedOff = document.createElement("div");
                signedOff.className = "signed-off";
                signedOff.textContent = "Job has been signed off by the driver, measurements are no longer editable.";
                containerCentered.appendChild(signedOff);
            }
            // Add the required measurement
            //
            // Gross
            // Output the gross, tare and nett inputs.
            var weightRequirements = [{
                    type: "gross",
                    text: "Gross Weight (Tonnes)",
                    maxUnit: Math.floor(CONSTANTS.MEASUREMENTS.MAX_GROSS_TONNAGE / 10),
                    existingTonnesValue: Helper._getWholeNumber(this.job.gross, "string"),
                    existingKilosValue: Helper._getFloatingValue(this.job.gross, "string")
                }, {
                    type: "tare",
                    text: "Tare Weight (Tonnes)",
                    maxUnit: Math.floor(CONSTANTS.MEASUREMENTS.MAX_GROSS_TONNAGE / 10),
                    existingTonnesValue: Helper._getWholeNumber(this.job.tare, "string"),
                    existingKilosValue: Helper._getFloatingValue(this.job.tare, "string")
                }];
            // Make sure we're padding for < 10 values (for re-rendering).
            weightRequirements.forEach(function (el) {
                el.existingTonnesValue = (el.existingTonnesValue < 10 ? '0' : '') + el.existingTonnesValue;
                el.existingKilosValue = Helper._padRight(el.existingKilosValue.toString(), 3, '0');
            });
            weightRequirements.forEach(function (el) {
                // ...
                // Label
                var label = document.createElement("label");
                label.htmlFor = el.type;
                label.textContent = el.text;
                weightSection.appendChild(label);
                // Inputs
                var inputs = document.createElement("div");
                inputs.className = "dropdown-inputs";
                // Split the current value out if we've got one.
                var existingTonnes1 = "0", existingTonnes2 = "0";
                if (!Helper._undefinedNullOrNaN(el.existingTonnesValue)) {
                    existingTonnes1 = el.existingTonnesValue.toString().substr(0, 1);
                    existingTonnes2 = el.existingTonnesValue.toString().substr(1, 1);
                }
                var type = el.type;
                // Output two tonnes inputs.
                var dropdown1 = document.createElement("div"), tonnesSelect1 = document.createElement("select");
                tonnesSelect1.id = type + "-tonnes-1";
                // Build the tonnes 10 dropdown - using the max as the cap.
                for (var i = 0; i <= el.maxUnit; i++) {
                    var opt = i, optionStr = opt.toString(), inputOption = document.createElement("option");
                    inputOption.value = optionStr;
                    inputOption.text = optionStr;
                    if (optionStr === existingTonnes1)
                        inputOption.selected = true;
                    tonnesSelect1.add(inputOption);
                }
                ;
                dropdown1.className = "dropdown-input";
                dropdown1.appendChild(tonnesSelect1);
                inputs.appendChild(dropdown1);
                var dropdown2 = document.createElement("div"), tonnesSelect2 = document.createElement("select");
                tonnesSelect2.id = type + "-tonnes-2";
                zeroToTen.forEach(function (opt) {
                    var optionStr = opt.toString(), inputOption = document.createElement("option");
                    inputOption.value = optionStr;
                    inputOption.text = optionStr;
                    if (optionStr === existingTonnes2)
                        inputOption.selected = true;
                    tonnesSelect2.add(inputOption);
                });
                dropdown2.className = "dropdown-input";
                dropdown2.appendChild(tonnesSelect2);
                inputs.appendChild(dropdown2);
                // Add the period separator.
                var period = document.createElement("div");
                period.className = "dropdown-input dropdown-input-separator";
                period.textContent = ".";
                inputs.appendChild(period);
                // Split the current value out if we've got one.
                var existingKilos = ["0", "0", "0"];
                if (!Helper._undefinedNullOrNaN(el.existingKilosValue)) {
                    existingKilos[0] = el.existingKilosValue.toString().substr(0, 1);
                    existingKilos[1] = el.existingKilosValue.toString().substr(1, 1);
                    existingKilos[2] = el.existingKilosValue.toString().substr(2, 1);
                }
                // Output three kilos inputs.
                [1, 2, 3].forEach(function (el) {
                    var dropdown = document.createElement("div"), selectInput = document.createElement("select");
                    selectInput.id = type + "-kilos-" + el.toString();
                    zeroToTen.forEach(function (opt) {
                        var optionStr = opt.toString(), inputOption = document.createElement("option");
                        inputOption.value = optionStr;
                        inputOption.text = optionStr;
                        if (optionStr === existingKilos[el - 1])
                            inputOption.selected = true;
                        selectInput.add(inputOption);
                    });
                    dropdown.className = "dropdown-input";
                    dropdown.appendChild(selectInput);
                    inputs.appendChild(dropdown);
                });
                weightSection.appendChild(inputs);
            });
            // Tonnage (nett) input
            // ...
            // Label
            var nettLabel = document.createElement("label");
            nettLabel.htmlFor = "nett";
            nettLabel.textContent = "Nett Weight (Tonnes)";
            weightSection.appendChild(nettLabel);
            // Input
            var nettInput = document.createElement("input");
            nettInput.id = "nett";
            nettInput.type = "number";
            nettInput.value = !Helper._undefinedNullOrNaN(this.job.nett) ? this.job.nett.toString() : "0.000";
            nettInput.disabled = true;
            weightSection.appendChild(nettInput);
            containerCentered.appendChild(weightSection);
        }
        else {
            // Form header
            var header = document.createElement("div");
            header.className = "header";
            header.textContent = "Quantity Detail";
            containerCentered.appendChild(header);
            // Quantity input
            // ...
            // Label
            var quantityLabel = document.createElement("label");
            quantityLabel.htmlFor = "nett";
            quantityLabel.textContent = "Quantity";
            weightSection.appendChild(quantityLabel);
            // Input
            var quantityInput = document.createElement("input");
            quantityInput.id = "nett";
            quantityInput.type = "number";
            quantityInput.value = !Helper._undefinedNullOrNaN(this.job.nett) ? this.job.nett.toString() : "0";
            weightSection.appendChild(quantityInput);
            containerCentered.appendChild(weightSection);
        }
        // Add the specific elements to the main container
        mainContainer.appendChild(containerCentered);
        // Add the main container to the page
        onto.appendChild(mainContainer);
        // We need to wait until the popup has been rendered before we can call the jSignature setup function.
        this.onRenderred.push(function () {
            // Bind the updating function.
            window.jQuery(".dropdown-input select").on('change', function () {
                _this.addCalculations();
            });
        });
    };
    // Set the various dropdowns to update accordingly.
    MeasurementsPage.prototype.addCalculations = function () {
        // Set nett values when gross / tare are updated.
        var gross = parseFloat(window.jQuery("#gross-tonnes-1").val() + window.jQuery("#gross-tonnes-2").val() + "." + window.jQuery("#gross-kilos-1").val() + window.jQuery("#gross-kilos-2").val() + window.jQuery("#gross-kilos-3").val()), tare = parseFloat(window.jQuery("#tare-tonnes-1").val() + window.jQuery("#tare-tonnes-2").val() + "." + window.jQuery("#tare-kilos-1").val() + window.jQuery("#tare-kilos-2").val() + window.jQuery("#tare-kilos-3").val());
        var nett = (gross - tare).toFixed(3);
        window.jQuery("#nett").val(nett);
        if (parseFloat(nett) < 0)
            window.jQuery("#nett").addClass("error-highlight");
        else
            window.jQuery("#nett").removeClass("error-highlight");
    };
    // Validate the data - we need a measurement value.
    MeasurementsPage.prototype.validate = function () {
        var errorMessage = "", gross = null, tare = null, nett = null;
        if (this.job.requiredMeasurement === CONSTANTS.MEASUREMENTS.TONNES) {
            gross = parseFloat(window.jQuery("#gross-tonnes-1").val() + window.jQuery("#gross-tonnes-2").val() + "." + window.jQuery("#gross-kilos-1").val() + window.jQuery("#gross-kilos-2").val() + window.jQuery("#gross-kilos-3").val());
            tare = parseFloat(window.jQuery("#tare-tonnes-1").val() + window.jQuery("#tare-tonnes-2").val() + "." + window.jQuery("#tare-kilos-1").val() + window.jQuery("#tare-kilos-2").val() + window.jQuery("#tare-kilos-3").val());
            nett = parseFloat((window.jQuery("#nett")).val());
            // Validation
            if (Helper._undefinedNullOrNaN(gross))
                errorMessage = Helper._stringSuffix(errorMessage, "Gross Weight", ", ");
            if (Helper._undefinedNullOrNaN(tare))
                errorMessage = Helper._stringSuffix(errorMessage, "Tare Weight", ", ");
            if (gross > CONSTANTS.MEASUREMENTS.MAX_GROSS_TONNAGE)
                errorMessage = Helper._stringSuffix(errorMessage, "A valid Gross Weight (max. 42 tonnes)", ", ");
            if (nett > CONSTANTS.MEASUREMENTS.MAX_NETT_TONNAGE || nett === 0)
                errorMessage = Helper._stringSuffix(errorMessage, "Valid Weights (max. Nett 36 tonnes)", ", ");
            if (tare > gross)
                errorMessage = Helper._stringSuffix(errorMessage, "Valid Weights (Tare must be less than Gross)", ", ");
        }
        else {
            nett = parseFloat((window.jQuery("#nett")).val());
            if (nett < 1)
                errorMessage = Helper._stringSuffix(errorMessage, "A valid quantity", ", ");
        }
        if (errorMessage !== "") {
            AppManager.dealWithError({
                header: "Incomplete Details",
                text: "Please enter: " + errorMessage
            });
            return false;
        }
        this.gross = gross;
        this.tare = tare;
        this.nett = nett;
        return true;
    };
    // Save the measurement
    MeasurementsPage.prototype.submit = function () {
        if (!this.validate())
            return;
        this.job.gross = this.gross;
        this.job.tare = this.tare;
        this.job.nett = this.nett;
        this.job.save();
        if (this.job.requireStreams) {
            window.navigationManager.goToPage(PageConfig.Breakdown);
        }
        else {
            Job.completeJob();
        }
    };
    MeasurementsPage.prototype.back = function () {
        Job.goCurrentJob();
    };
    // Expose the back function.
    MeasurementsPage.back = function () {
        window.jmfw(PageConfig.Measurements.tagName)[0].back();
    };
    // Expose the submit function.
    MeasurementsPage.submit = function () {
        window.jmfw(PageConfig.Measurements.tagName)[0].submit();
    };
    return MeasurementsPage;
}(BaseAppPage));
document.registerElement(PageConfig.Measurements.tagName, MeasurementsPage);
var PopUp = /** @class */ (function (_super) {
    __extends(PopUp, _super);
    function PopUp() {
        return _super.call(this) || this;
    }
    PopUp.prototype.createdCallback = function () {
    };
    PopUp.prototype.attachedCallback = function () {
        this.draw();
    };
    // When a popup is cleared, the whole thing can be removed (as opposed to pages, where only sections are removed)
    PopUp.prototype.clear = function () {
        this.parentNode.removeChild(this);
    };
    PopUp.prototype.draw = function () {
        var _this = this;
        var overlay = document.createElement("div"), popup = document.createElement("div"), titleBar = document.createElement("div"), title = document.createElement("div"), close = document.createElement("div"), whenPopUpIsRendered = []; // An array of functions to be run once rendered.
        overlay.className = "overlay-with-content";
        popup.className = "pop-up" + (Helper._booleanValue(this.isFullScreen) ? " pop-up-full-screen" : "");
        titleBar.className = "pop-up-title-bar";
        if (!Helper._undefinedNullOrEmptyString(this.titleText)) {
            title.className = "pop-up-title";
            title.textContent = this.titleText;
            titleBar.appendChild(title);
            close.className = "pop-up-title-close";
            close.textContent = "X";
            close.onclick = function () {
                // Use the second action function, if there is one, on close as well.
                if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions.length > 1)
                    AppManager.executeFunction(_this.actions[1]);
                _this.clear();
            };
            titleBar.appendChild(close);
            popup.appendChild(titleBar);
        }
        var popupContent = document.createElement("pop-up-content");
        // Add the message block if we've got text.
        var popupText = null;
        if (!Helper._undefinedNullOrEmptyString(this.messageText) || !Helper._undefinedOrNull(this.contentElement)) {
            popupText = document.createElement("div");
            // Allow the use of custom HTML - either text or an HTML element. Text will use innerHTML and a raw element will simply be appended to the popup as normal.
            if (this.isHTML) {
                if (!Helper._undefinedOrNull(this.contentElement)) {
                    popupText.appendChild(this.contentElement);
                }
                else {
                    popupText.innerHTML = String(this.messageText);
                }
            }
            else {
                popupText.textContent = String(this.messageText) || "";
            }
            popupText.className = "pop-up-message";
        }
        // Add any inputs we need.
        var popupInputs = null;
        if (!Helper._undefinedNullOrEmptyArray(this.inputs)) {
            popupInputs = document.createElement("div");
            popupInputs.classList.add("pop-up-inputs");
            this.inputs.forEach(function (input) {
                var popupInput = null, popupInputAdditional = []; // Any elements that require adding after the input element.
                switch (input.type) {
                    case "textarea":
                        popupInput = document.createElement("textarea");
                        // If we're displaying a text area, let the popup be bigger - only necessary in regular popups, i.e. not full screen.
                        if (!_this.isFullScreen)
                            popup.classList.add("wide-boy");
                        break;
                    case "select":
                        popupInput = document.createElement("select");
                        input.options.forEach(function (opt) {
                            var inputOption = document.createElement("option");
                            inputOption.value = opt.toLowerCase();
                            inputOption.text = opt;
                            if (opt === input.value)
                                inputOption.selected = true;
                            popupInput.add(inputOption);
                        });
                        break;
                    case "signature":
                        // Holder div the canvas will ne drawn in.
                        popupInput = document.createElement("div");
                        popupInput.className = "signature";
                        // Always add a clear button.
                        var clearButton = document.createElement("app-button");
                        clearButton.buttonText = "Clear Signature";
                        clearButton.className = "tertiary-button";
                        clearButton.event = function () {
                            window.jQuery("#" + input.id).jSignature("clear");
                        };
                        popupInputAdditional.push(clearButton);
                        // We need to wait until the popup has been rendered before we can call the jSignature setup function.
                        whenPopUpIsRendered.push(function () {
                            // Now that we've got physical DOM elements, run any jSignature setups (this will cover both driver and / or customer signature fields).
                            window.jQuery(".pop-up-input-signature").jSignature({ "decor-color": "transparent" });
                        });
                        break;
                    default:
                        popupInput = document.createElement("input");
                        popupInput.type = input.type;
                        break;
                }
                // Add a label if we need to.
                if (!Helper._undefinedNullOrEmptyString(input.label)) {
                    var labelElement = document.createElement("label");
                    labelElement.htmlFor = input.id;
                    labelElement.textContent = input.label;
                    popupInputs.appendChild(labelElement);
                }
                popupInput.id = input.id;
                popupInput.name = input.name;
                popupInput.value = input.value || "";
                popupInput.className = "pop-up-input pop-up-input-" + input.type;
                popupInput.addEventListener("keyup", function (el) {
                    // Update the relevant input with its new value.
                    var inputElement = el.srcElement, input = Helper._getObjectFromArrayByPropertyValue(_this.inputs, "id", inputElement.id);
                    input.value = inputElement.value;
                    // Update the mandatory styling.
                    if (input.mandatory) {
                        var addOrRemove = "remove";
                        if (input.type === CONSTANTS.POPUP_INPUT_TYPE.SIGNATURE) {
                            var b30 = window.jQuery("#" + input.id).jSignature("getData", "base30");
                            if (Helper._undefinedNullOrEmptyArray(b30) || Helper._undefinedNullOrEmptyString(b30[1]))
                                addOrRemove = "add";
                        }
                        else if (Helper._undefinedNullOrEmptyString(input.value)) {
                            addOrRemove = "add";
                        }
                        inputElement.classList[addOrRemove]("mandatory");
                    }
                });
                popupInputs.appendChild(popupInput);
                popupInputAdditional.forEach(function (el) {
                    popupInputs.appendChild(el);
                });
            });
        }
        // Add any large option buttons.
        var popupOptionList = null;
        if (!Helper._undefinedNullOrEmptyArray(this.options)) {
            if (this.options.length > 0) {
                popupOptionList = document.createElement("pop-up-option-list");
                this.options.forEach(function (option) {
                    var popupOption = document.createElement("pop-up-option");
                    popupOption.id = Helper._safeId(option.major);
                    popupOption.major = option.major;
                    popupOption.minor = option.minor;
                    popupOption.event = option.event;
                    popupOption.complete = option.complete;
                    popupOptionList.appendChild(popupOption);
                });
            }
        }
        // If we've specified a different order for the elements, apply that here.
        if (!Helper._undefinedNullOrEmptyArray(this.order)) {
            this.order.forEach(function (item) {
                switch (item) {
                    case "content":
                        if (!Helper._undefinedOrNull(popupText))
                            popupContent.appendChild(popupText);
                        break;
                    case "inputs":
                        if (!Helper._undefinedOrNull(popupInputs))
                            popupContent.appendChild(popupInputs);
                        break;
                    case "options":
                        if (!Helper._undefinedOrNull(popupOptionList))
                            popupContent.appendChild(popupOptionList);
                        break;
                    default:
                        break;
                }
            });
        }
        else {
            // Otherwise, use the default ordering.
            if (!Helper._undefinedOrNull(popupText))
                popupContent.appendChild(popupText);
            if (!Helper._undefinedOrNull(popupInputs))
                popupContent.appendChild(popupInputs);
            if (!Helper._undefinedOrNull(popupOptionList))
                popupContent.appendChild(popupOptionList);
        }
        // Add the content block to the popup.
        popup.appendChild(popupContent);
        // Output the different layout based on the type of button.
        // The actions array should store the first element as the confirmation / positive answer and
        //   the second as cancellation / negative.
        // Anything other than the two options available in this way could be achieved by using the 
        //   options array instead (doesn't currently cater for more than two buttons).
        var popupButtons = [];
        switch (this.type) {
            case "OK":
                popupButtons.push({
                    buttonText: "OK",
                    isPositive: true,
                    event: function () {
                        if (!_this.validate())
                            return;
                        // Run the action function if it exists.
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[0] !== undefined)
                            AppManager.executeFunction(_this.actions[0]);
                        _this.clear();
                    }
                });
                break;
            case "OKCANCEL":
                popupButtons.push({
                    buttonText: "Cancel",
                    isNegative: true,
                    event: function () {
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[1] !== undefined)
                            AppManager.executeFunction(_this.actions[1]);
                        _this.clear();
                    }
                }, {
                    buttonText: "OK",
                    isPositive: true,
                    event: function () {
                        if (!_this.validate())
                            return;
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[0] !== undefined)
                            AppManager.executeFunction(_this.actions[0]);
                        _this.clear();
                    }
                });
                break;
            case "CANCEL":
                popupButtons.push({
                    buttonText: "Cancel",
                    isNegative: true,
                    event: function () {
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[0] !== undefined)
                            AppManager.executeFunction(_this.actions[0]);
                        _this.clear();
                    }
                });
                break;
            case "YESNO":
                popupButtons.push({
                    buttonText: "No",
                    isNegative: true,
                    event: function () {
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[1] !== undefined)
                            AppManager.executeFunction(_this.actions[1]);
                        _this.clear();
                    }
                }, {
                    buttonText: "Yes",
                    isPositive: true,
                    event: function () {
                        if (!_this.validate())
                            return;
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[0] !== undefined)
                            AppManager.executeFunction(_this.actions[0]);
                        _this.clear();
                    }
                });
                break;
            case "SUBMIT":
                popupButtons.push({
                    buttonText: "Submit",
                    isPositive: true,
                    event: function () {
                        if (!_this.validate())
                            return;
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[1] !== undefined)
                            AppManager.executeFunction(_this.actions[1]);
                        _this.clear();
                    }
                });
                break;
            case "SUBMITCANCEL":
                popupButtons.push({
                    buttonText: "Cancel",
                    isNegative: true,
                    event: function () {
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[1] !== undefined)
                            AppManager.executeFunction(_this.actions[1]);
                        _this.clear();
                    }
                }, {
                    buttonText: "Submit",
                    isPositive: true,
                    event: function () {
                        if (!_this.validate())
                            return;
                        if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[0] !== undefined)
                            AppManager.executeFunction(_this.actions[0]);
                        _this.clear();
                    }
                });
                break;
            default:
                // If we haven't got a type, then we must have a title bar - otherwise the popup will not be closeable.
                if (Helper._undefinedNullOrEmptyString(this.titleText)) {
                    popupButtons.push({
                        buttonText: "OK",
                        isPositive: true,
                        event: function () {
                            if (!_this.validate())
                                return;
                            // Run the action function if it exists.
                            if (!Helper._undefinedNullOrEmptyArray(_this.actions) && _this.actions[0] !== undefined)
                                AppManager.executeFunction(_this.actions[0]);
                            _this.clear();
                        }
                    });
                }
                break;
        }
        // If we've got 'footer' buttons, output a button bar.
        if (!Helper._undefinedNullOrEmptyArray(popupButtons)) {
            var popupButtonBar_1 = document.createElement("button-bar");
            popupButtons.forEach(function (button) {
                var popupButton = document.createElement("button-bar-button");
                popupButton.buttonText = button.buttonText;
                popupButton.iconName = button.iconName;
                popupButton.iconOnly = button.iconOnly;
                popupButton.isBack = button.isBack;
                popupButton.event = button.event;
                // Being a bit hacky here and stopping positive / negative buttons on full screen popups as these are tickets so we don't really want that.
                if (!_this.isFullScreen) {
                    popupButton.isPositive = button.isPositive;
                    popupButton.isNegative = button.isNegative;
                    popupButton.isBack = button.isBack;
                }
                popupButtonBar_1.buttons.push(popupButton);
            });
            popup.appendChild(popupButtonBar_1);
        }
        overlay.appendChild(popup);
        this.appendChild(overlay);
        // Run anything that needed to wait until the popup was rendered.
        if (!Helper._undefinedNullOrEmptyArray(whenPopUpIsRendered))
            whenPopUpIsRendered.forEach(function (f) {
                AppManager.executeFunction(f);
            });
    };
    // Loops through each of the popup input items and runs any validation on them.
    // Will also run any function passed through as the validation property.
    PopUp.prototype.validate = function () {
        var valid = true, anyInvalid = false;
        if (!this.inputs)
            return valid;
        this.inputs.forEach(function (i) {
            // If this is a 'normal' input, it should have a value if mandatory.
            if (i.mandatory) {
                switch (i.type) {
                    case CONSTANTS.POPUP_INPUT_TYPE.SIGNATURE:
                        // Check for signature entries - need to check the base30 data for the existence of a signature,
                        // this is stroke data - base64 will return the image, which includes the canvas and is therefore never empty.
                        var signatureBase30 = window.jQuery("#" + i.id).jSignature("getData", "base30");
                        if (Helper._undefinedNullOrEmptyArray(signatureBase30) || Helper._undefinedNullOrEmptyString(signatureBase30[1]))
                            valid = false;
                        break;
                    default:
                        // Grab the current value of the input to validate.
                        var value = window.jQuery("#" + i.id).val();
                        if (Helper._undefinedNullOrEmptyString(value))
                            valid = false;
                        break;
                }
            }
            // If the item in question is not valid for some reason, mark it as so.
            if (!valid) {
                anyInvalid = true;
                // Mark the element in question as mandatory.
                document.getElementById(i.id).classList.add("mandatory");
            }
        });
        // If we've failed on mandatory fields, return now.
        if (anyInvalid)
            AppManager.popup({
                type: "OK",
                titleText: "Incomplete",
                messageText: "Please complete all mandatory fields."
            });
        if (this.validation)
            return AppManager.executeFunction(this.validation);
        return valid;
    };
    return PopUp;
}(HTMLElement));
document.registerElement("pop-up", PopUp);
var PopupContent = /** @class */ (function (_super) {
    __extends(PopupContent, _super);
    function PopupContent() {
        return _super.call(this) || this;
    }
    PopupContent.prototype.createdCallback = function () {
    };
    PopupContent.prototype.attachedCallback = function () {
    };
    return PopupContent;
}(HTMLDivElement));
document.registerElement("pop-up-content", PopupContent);
var PopupOptionList = /** @class */ (function (_super) {
    __extends(PopupOptionList, _super);
    function PopupOptionList() {
        return _super.call(this) || this;
    }
    PopupOptionList.prototype.createdCallback = function () {
    };
    PopupOptionList.prototype.attachedCallback = function () {
    };
    return PopupOptionList;
}(HTMLDivElement));
document.registerElement("pop-up-option-list", PopupOptionList);
var PopUpOption = /** @class */ (function (_super) {
    __extends(PopUpOption, _super);
    function PopUpOption() {
        return _super.call(this) || this;
    }
    PopUpOption.prototype.createdCallback = function () {
    };
    PopUpOption.prototype.attachedCallback = function () {
        var _this = this;
        this.onclick = function () {
            if (typeof _this.event === "function")
                _this.event();
        };
        var major = document.createElement("span");
        major.className = "pop-up-option-major";
        major.textContent = this.major;
        this.appendChild(major);
        var minor = document.createElement("span");
        minor.className = "pop-up-option-minor";
        minor.textContent = this.minor;
        this.appendChild(minor);
        if (this.complete)
            this.className = "complete";
    };
    return PopUpOption;
}(HTMLElement));
document.registerElement("pop-up-option", PopUpOption);
var PullToRefresh = /** @class */ (function (_super) {
    __extends(PullToRefresh, _super);
    function PullToRefresh() {
        return _super.call(this) || this;
    }
    PullToRefresh.prototype.createdCallback = function () {
        this.scroller = document.createElement("ptr-scroller");
        this.appendChild(this.scroller);
    };
    PullToRefresh.prototype.attachedCallback = function () {
        var _this = this;
        if (this.id === "") {
            console.error("PTR: Wrapper ID must be set.");
            return;
        }
        if (window.jQuery === undefined) {
            console.error("PTR: jQuery not available.");
            return;
        }
        setTimeout(function () { _this.loaded(); }, 500);
    };
    PullToRefresh.prototype.loaded = function () {
        var _this = this;
        console.log("==============================================================================", " DEBUG: Running loaded()");
        var pullDownEl, pullDownOffset, hitPullDownLimit = false;
        pullDownEl = document.getElementById("ptr");
        if (pullDownEl === undefined) {
            console.error("PTR: loaded() Loading DIV not available.");
            return;
        }
        pullDownOffset = pullDownEl.offsetHeight;
        console.log("pullDownOffset: " + pullDownOffset);
        // Max progress value
        var pullDownMaxValue = pullDownOffset;
        this.myScroll = new iScroll(this.id, {
            useTransition: true,
            useTransform: true,
            topOffset: pullDownOffset,
            // checkDOMChanges: false,
            // click: false,
            // doubleTapZoom: 2,
            // fadeScrollbar: false,
            // hScroll: true,
            // hScrollbar: false,
            // handleClick: true,
            hideScrollbar: true,
            // onBeforeScrollEnd: null,
            // onBeforeScrollMove: null,
            // onDestroy: null,
            // onScrollStart: null,
            // onTouchEnd: null,
            // onZoom: null,
            // onZoomEnd: null,
            // onZoomStart: null,
            // scrollbarClass: "",
            // snap: false,
            // snapThreshold: 1,
            // vScroll: true,
            // vScrollbar: false,
            // wheelAction: "scroll",
            // x: 0,
            // y: 0,
            // zoom: false,
            // zoomMax: 4,
            // zoomMin: 1,
            onRefresh: function () {
                console.log("==============================================================================", " DEBUG: myScroll.onRefresh called()");
                if (hitPullDownLimit)
                    hitPullDownLimit = false;
            },
            onScrollMove: function () {
                console.log("==============================================================================", " DEBUG: myScroll.onScrollMove called");
                var pullDownProgress = 1 - this.y / (-pullDownOffset), wrapperEl = window.jQuery("#" + this.wrapper.id);
                if (pullDownProgress <= 0) {
                    wrapperEl.addClass("ptr-reset");
                }
                else {
                    wrapperEl.removeClass("ptr-reset");
                }
                if (pullDownProgress < 1) {
                    hitPullDownLimit = false;
                    this.minScrollY = -pullDownOffset;
                    wrapperEl.removeClass("ptr-loading ptr-refresh");
                }
                else {
                    hitPullDownLimit = true;
                    this.minScrollY = 0;
                    wrapperEl.addClass("ptr-refresh");
                }
            },
            onScrollEnd: function () {
                console.log("==============================================================================", " DEBUG: myScroll.onScrollEnd called");
                var wrapperEl = window.jQuery("#" + this.wrapper.id);
                if (hitPullDownLimit && wrapperEl.hasClass("ptr-refresh")) {
                    this.wrapper.pullDownAction();
                }
                else {
                    wrapperEl.addClass("ptr-reset").removeClass("ptr-loading ptr-refresh");
                }
            }
        });
        setTimeout(function () { document.getElementById(_this.id).style.left = '0'; }, 800);
    };
    PullToRefresh.prototype.pullDownAction = function () {
        var _this = this;
        console.log("==============================================================================", " DEBUG: Pull down action executed");
        window.jQuery("#" + this.id).addClass("ptr-loading");
        if (this.pullFunction === undefined) {
            console.error("PTR: pullFunction not set up.");
            return;
        }
        this.pullFunction(function () { _this.cleanup(); _this.myScroll.refresh(); });
    };
    PullToRefresh.prototype.cleanup = function () {
        var wrapperEl = window.jQuery("#" + this.id);
        wrapperEl.addClass("ptr-reset").removeClass("ptr-loading ptr-refresh");
        // This is a horrible hack because iScroll struggles with resetting to the right coords - but only after having already scrolled.
        // Get the top of the scroller section, we're then going to subtract the height of the loading section to know how far back up
        // we need to push the scroller.
        var scrollerCoords = window.jQuery("#" + this.id + " ptr-scroller").offset(), scrollerTop = scrollerCoords.top, loadingHeight = window.jQuery("#" + this.id + " #ptr").height(), newScrollerTop = scrollerTop - loadingHeight;
        window.jQuery("#" + this.id + " ptr-scroller").offset({ top: newScrollerTop, left: scrollerCoords.left });
    };
    return PullToRefresh;
}(HTMLDivElement));
var PtrScroller = /** @class */ (function (_super) {
    __extends(PtrScroller, _super);
    function PtrScroller() {
        return _super.call(this) || this;
    }
    PtrScroller.prototype.createdCallback = function () {
        this.innerHTML =
            "<div id=\"ptr\">\n        <span class=\"loading-start\"></span>\n\n        <div class=\"loading\">\n          <span id=\"l1\"></span>\n          <span id=\"l2\"></span>\n          <span id=\"l3\"></span>\n        </div>\n      </div>";
    };
    PtrScroller.prototype.attachedCallBack = function () { };
    return PtrScroller;
}(HTMLDivElement));
document.registerElement('ptr-scroller', PtrScroller);
document.registerElement('pull-to-refresh', PullToRefresh);
// document.addEventListener('touchmove', function(e) { e.preventDefault(); }, false);
