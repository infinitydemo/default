(function($, mc) {

  var clearBusyTicker;
  var lastActivity;

  function clearBusyClass(e) {
    try {
      /* var busyThreshold = 5000;

			if(e!=undefined)
			{
				if(e.direction=='in')
				{
					$('.busyMask').removeClass('busy');
				}
			}

			var currentTime = new Date();

			if(currentTime>lastActivity+busyThreshold)
			{
				$('.busyMask').removeClass('busy');
			} */
    } catch (error) {}
  }

  mc.fl.showBusy = function(args) {
    function addDiv() {
      var activityInnerDiv = document.createElement("div");
      $(".activity")[0].appendChild(activityInnerDiv);
    }

    window.setTimeout(addDiv, 10);
  };

  mc.fl.hideBusy = function(args) {
    /* $('.busyMask').removeClass('busy'); */
  };

  mc.fl.forceActivityUntil = function(args) {
    try {
      /* var interval = args[0];
			var targetPage = args[1];

			lastActivity = new Date();

			$(".busyMask").addClass("busy"); */

    } catch (error) {}
  };

  mc.fl.createBusyPage = function(args) {
    /* var busyDiv = document.createElement('div');
		busyDiv.className = 'busyMask';
		busyDiv.appendChild(document.createElement('div'));
		$('body')[0].appendChild(busyDiv); */
  };

  mc.fl.dateFromString = function(args) {
    return new Date(args[0]);
  };

  mc.fl.testingInBrowser = function() {
    try {
      //Do something that is only available in the shell
      if (cordova.exec === undefined) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return true;
    }
  };

  mc.fl.canSendDirectData = function() {
    try {
      //Do something that is only available in the shell
      if (cordova.exec === undefined) {
        return false;
      } else {
        return true;
      }
    } catch (err) {
      return false;
    }
  };

  mc.fl.sortArray = function(params) {
    //params[0] - array to be sorted
    //params[1] - key to sort
    //params[2] - sortDescending

    params[0].sort(function(a, b) {
      return a[params[1]] - b[params[1]];
    });
    if (params[3]) {
      params[0].reverse();
    }
    return params[0];
  };

  mc.fl.scrollToItem = function(params) {
    return;
  };

  mc.fl.disableButton = function(params) {
    var element = $(params[0]);
    element[0].disabled = true;
  };

  mc.fl.JSONObjectsArray = function(args) {
    try {
      var obj = JSON.parse(args[0]);
      var arr = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          arr.push(obj[key].id);
        }
      }
      return arr;
    } catch (e) {
      return undefined;
    }
  };

  mc.fl.JSONParse = function(args) {
    try {
      return JSON.parse(args[0]);
    } catch (e) {
      return undefined;
    }
  };

  mc.fl.setPopUpPageTitleBarText = function(args) {
    var pageId = args[0];
    var title = args[1];
    var headerTitle;
    headerTitle = $('#' + pageId + ' .jmuiHeader h1');
    if (headerTitle) {
      headerTitle.item(0).html(title);
    }
  };

  mc.fl.GetDeviceInfo = function(params) {

    // Perform Synchonous processing here - remember that this should not be a "blocking" function
    var results = [];

    var deviceId;
    var deviceName;
    var processVersion;

    var userInfo = mc.db.getUserInfo();
    /*AUTO_GENERATE-ExportDate*/
    var ExportDate = "08/03/2013";

    results.push(userInfo.mSuiteSerialNo); // mSuite Serial Number
    results.push(userInfo.mSuiteUserName); // mSuite User Name
    results.push(mc.db.getCurrentProcess().version); // version of current process

    results.push(navigator.platform); // Browser platform ID

    // Get information from PhoneGap, if it's there
    if (typeof device !== "undefined") {
      results.push(device.name); // Phone name
      results.push(device.model); // Phone model
      results.push(device.platform); // Phone platform
      results.push(device.uuid); // Phone UUID
      results.push(device.version); // Phone Version
    } else {
      results.push("n/a"); // Phone name
      results.push("n/a"); // Phone model
      results.push("n/a"); // Phone platform
      results.push("n/a"); // Phone UUID
      results.push("n/a"); // Phone Version
    }

    results.push(ExportDate); // Process Export Date

    // Return the result to mDesign script
    return results;

  };

  mc.fl.customgetobjectvalue = function(args) {
    var object = args[0];
    var attribute = args[1];

    var value = object[attribute];
    if (value === undefined) {
      value = '';
    }
    return value;
  };

  mc.fl.setEnvironmentObject = function(args) {
    var name = args[0];
    var value = JSON.stringify(args[1]);
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      if (e.code === 22) { // QUOTA_EXCEEDED_ERR - iPad bug workaround
        localStorage.removeItem(name);
        localStorage.setItem(name, value);
      }
    }
  };

  mc.fl.getEnvironmentObject = function(args) {
    var value = localStorage.getItem(args[0]) || '';
    if (value === '')
      return '';
    else
      return JSON.parse(value);
  };

  mc.fl.clearAllClassesExcept = function(args) {
    try {
      var className = args[1] === undefined ? "" : args[1];
      $(args[0])[0].className = className;
    } catch (error) {}
  };

  mc.fl.addClass = function(args) {
    try {
      $(args[0]).addClass(args[1]);
    } catch (error) {}
  };

  mc.fl.removeClass = function(args) {
    try {
      $(args[0]).removeClass(args[1]);
    } catch (error) {}
  };

  mc.fl.toggleClass = function(args) {
    try {
      $(args[0]).each(function() {
        if ($(this).hasClass(args[1])) {
          $(this).removeClass(args[1]);
        } else {
          $(this).addClass(args[1]);
        }
      });
    } catch (error) {}
  };

  mc.fl.updateUIText = function(args) {
    //arg 0 is the DOM element you want to target e.g execjssync("updateUIText",".element", "newTextValue");
    try {
      $(args[0])[0].innerText = args[1];
    } catch (error) {}
  };

  mc.fl.updateUIHTML = function(args) {
    //arg 0 is the DOM element you want to target e.g execjssync("updateUIHTML",".element", "newInnerHTMLValue");

    try {
      $(args[0])[0].innerHTML = args[1];
    } catch (error) {}
  };

  mc.fl.addEventHandler = function(args) {
    function calculateCallback() {

    }
    try {
      $(args[0]).bind(args[1], function() {
        mc.fl.calculate({
          resume: calculateCallback
        }, args[2]);
      });
    } catch (error) {}
  };

  mc.fl.round = function(args) {
    var num = args[0];
    var decimals = args[1];

    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // in mDesign Script, Call using:
  // execjssync("SetJsonItem", "ItemName", ItemValue);
  //
  mc.fl.SetJsonItem = function(params) {

    return mc.db.setJsonItem(params[0], params[1]);
  };

  // in mDesign Script, Call using:
  // ItemValue := execjssync("GetJsonItem", "ItemName", "Stringify");
  //
  mc.fl.GetJsonItem = function(params) {
    if (params.length > 1) {
      if (params[1].toLowerCase() === "stringify") {
        return JSON.stringify(mc.db.getJsonItem(params[0]));
      }
    }
    return mc.db.getJsonItem(params[0]);
  };

  // in mDesign Script, Call using:
  // ItemValue := execjssync("Stringify", JsonObjectToStringify );
  //
  mc.fl.Stringify = function(params) {
    return JSON.stringify(params[0]);
  };

  // in mDesign Script, Call using:
  // newGuid := execjssync("NewGuid");
  //
  mc.fl.NewGuid = function() {

    return mc.db.guid();
  };

  // boolResult := execjssync("processExists", "processID");
  //
  // Return TRUE if given process ID exists
  mc.fl.processExists = function(args) {
    var processId = args[0];
    var processVersions = mc.db.getProcessVersions(processId);

    return (processVersions.length > 0);
  };


  // updatedString := execjssync("regexReplace", "inputString", "regexForMatches", "replacementString");
  //
  // Return modified string based on the regexForMatches to identify the text within the inputString to replace and replace with the replacementString
  mc.fl.regexReplace = function(args) {
    var inputString = args[0];

    if (inputString) {
      var regex = args[1];
      var replacementString = args[2];

      var re = new RegExp(regex, "g");

      outputString = inputString.replace(re, replacementString);

      return (outputString);
    } else {
      return null;
    }
  };


  // From, mDesign, type:
  // 		execjssync("syncCalcParams", "mdesignvar:1,mdesignvar2:2");
  //
  // From, JavaScript, type:
  // 			mc.fl.syncCalcParams("newColTap",["varX:CantStart"])
  //
  //		This gives us the ability to inject an mDesign Data formula with a lot of variables.
  //		These variables are injected into environment variables which can be used
  //		by the formula.
  //
  //		Especially useful if you want to grab things out of the DOM at run time
  //		and post them into mDesign - outside of the standard functionality.
  //
  // NOTE: This is a fire-and-forget call - you can't look at the result.

  mc.fl.syncCalcParams = function(formulaName, params) {
    function thisCallback(r) {
      mc.hideActivity();
    }
    mc.showActivity();

    var keypairs = params[0].split(",");
    for (i = 0; i < keypairs.length; i++) {
      var parts = keypairs[i].split(":");
      mc.fl.setenvironment(parts[0], parts[1]);
    }
    mc.fl.calculate({
      "resume": thisCallback
    }, formulaName);
    event.stopPropagation();
  };

  // From, mDesign, type:
  // 		result := execjsasync("asyncCalcParams", "formulaName", "mdesignvar:1,mdesignvar2:2");
  //
  //		This gives us the ability to inject an mDesign Data formula with a lot of variables.
  //		These variables are injected into environment variables which can be used
  //		by the formula.
  //
  //		Especially useful if you want to grab things out of the DOM at run time
  //		and post them into mDesign - outside of the standard functionality.

  mc.fl.asyncCalcParams = function(callback, formulaName, params) {
    function thisCallback(r) {
      mc.hideActivity();
      callback.resume(r);
    }
    mc.showActivity();

    var keypairs = params[0].split(",");
    for (i = 0; i < keypairs.length; i++) {
      var parts = keypairs[i].split(":");
      mc.fl.setenvironment(parts[0], parts[1]);
    }
    mc.fl.calculate({
      "resume": thisCallback
    }, formulaName);
    event.stopPropagation();
  };

  // From, mDesign, type:
  // 		result := execjsasync("asyncExecFormula", "formulaName", [param1, param2...]);
  //
  //		This gives us the ability to inject an mDesign Data formula with a lot of variables.
  //		These variables are injected into environment variables which can be used
  //		by the formula.
  //
  //		Especially useful if you want to grab things out of the DOM at run time
  //		and post them into mDesign - outside of the standard functionality.

  mc.fl.asyncExecFormula = function(callback, params) {
    var name, formula, i, formulaParams;

    function complete(result) {
      callback.resume(result);
    }

    name = params[0];

    if (name && mc.fl[name] !== undefined && mc.fl[name].constructor === Function) {
      formula = window.make_formula(mc.fl[name]);
      formulaParams = [complete, complete];
      for (i = 1; i < params.length; i += 1) {
        formulaParams.push(params[i]);
      }
      formula.execute.apply(formula, formulaParams);
    } else {
      callback.resume("NOT FOUND");
    }
  };


  mc.fl.generateListChoices = function(args) {
    var staticChoices = args[0];
    var objectArrayString = args[1];
    var value = args[2];
    var label = args[3];

    var choices = staticChoices;
    var objectArray = [];
    try {

      objectArray = JSON.parse(objectArrayString);

    } catch (e) {}

    for (var choice = 0; choice < objectArray.length; choice++) {
      listChoice = {};
      include = false;
      if (args.length > 4) {
        include = true;
        for (var iFilter = 4; iFilter < args.length; iFilter = iFilter + 2) {
          if (objectArray[choice][args[iFilter]] != args[iFilter + 1]) {
            include = false;
          }
        }
      } else {
        include = true;
      }

      if (include) {
        listChoice.value = objectArray[choice][value];
        listChoice.label = objectArray[choice][label];
        choices.push(listChoice);
      }
    }

    return choices;
  };

  var eventBinderCount = 0;

  mc.fl.populateChoices = function(args) {
    function calculateCallback() {
      function testCallback() {}

      mc.fl.msgbox({
        resume: testCallback
      }, 'Count ' + eventBinderCount, 'Count ' + eventBinderCount);
    }

    function selectionMade(e) {
      if (!loading) {
        eventBinderCount++;
        console.log('selectionMade Call Count: ' + eventBinderCount);
        var newSelection;
        newSelection = e.srcElement.value;
        mc.fl.setdata(selectControlName, newSelection, 0);
        mc.fl.calculate({
          resume: calculateCallback
        }, selectedFormula);
      }
    }

    var loading = true;

    var selectControlPage = args[0];
    var selectControlName = args[1];
    var choices = args[2];
    var value = args[3];
    var label = args[4];
    var selectedFormula = args[5];

    var myProcess = mc.db.getCurrentProcess();
    var q = myProcess.questions[selectControlName];

    q.choices = [];

    if (choices.length > 0) {
      var i, n;
      n = choices.length;

      for (i = 0; i < n; i += 1) {
        q.choices.push({
          label: choices[i][label],
          value: choices[i][value]
        });
      }

      var selectedChoice = q.choices[0][value];
      mc.fl.setdata(selectControlName, selectedChoice, 0);


      /*var handleChangeEvent = function(e) {
					selectionMade(e);
				}*/

      //var selectControlStr = selectControlPage.concat(selectControlName);
      //var selectControl = document.getElementById(selectControlStr);

      $("#" + selectControlPage + selectControlName).show();

      //selectControl.removeEventListener('change', handleChangeEvent);
      //selectControl.addEventListener('change', handleChangeEvent);

      //$("#" + selectControlPage + selectControlName).unbind('change');
      //$("#" + selectControlPage + selectControlName).bind('change',function(e){selectionMade(e);});
    } else {
      $("#" + selectControlPage + selectControlName).hide();
    }

    mc.fl.refreshquestion(selectControlName);

    loading = false;

    return [true];
  };


  /**
   * Raise the default UI for composing emails
   *
   * @param to
   *					string containing a comma separated list of sms recipients to send to
   * @param body
   *					string containing text of body
   */
  mc.fl.composeSMS = function(args) {
    var params, url;
    var to, body;

    to = args[0];
    body = args[1];

    function appendParam(name, value) {
      if (value) {
        params.push(name + '=' + window.escape(value));
      }
    }
    url = 'sms:';
    if (to) {
      url += to;
    }
    url += '?';
    params = [];
    appendParam('body', body);
    url += params.join('&');
    mc.gotoUrl(url, false);
  };

  mc.fl.saveSubject = function(callback, args) {

    var subjectId = args[0];
    var _cso = args[1];

    //mc.db.setSubject(subjectId, _cso, false, callback);

    callback.resume(true);
  };

  // in mDesign Script, Call using:
  // 		WriteResult := execjsasync("createLocalFile", FilePath, FileString);
  //
  // 		e.g.
  //
  // 			WriteResult := execjsasync("createLocalFile", "/mnt/mDesign/Report.html", "<body><h1>Hello World</h1></body>");
  //
  //
  // Returns  "PASS" or "FAIL"
  //
  mc.fl.createLocalFile = function(callback, params) {
    var localFileName = params[0];
    var fileData = params[1];

    function fail(error) {
      callback.resume("FAIL");
    }

    function success(error) {
      callback.resume("PASS");
    }

    // Get the File System to get the file, to open it for writing.
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
      function(fileSystem) {
        fileSystem.root.getFile(localFileName, {
            create: true,
            exclusive: false
          },
          function(fileEntry) {
            fileEntry.createWriter(gotFileWriter, fail);
          },
          fail);
      },
      fail);

    // Fuction to actually write the file
    function gotFileWriter(writer) {
      writer.onerror = fail;
      writer.onwrite = function(evt)

      {
        success();
      };
      // Write the data away
      writer.write(fileData);
    }
  };

  mc.fl.changeAttrValue = function(args) {
    $(args[0]).attr(args[1], args[2]);
  };

  mc.fl.navigate = function(args) {
    window.navigationManager.goToPage(args[0]);
  };

  mc.fl.processCommsResponse = function(args) {
    window.commsManager.processResponse(args[0]);
  };

  function ready() {
    console.log("App framework ready");
    AppManager.registerElements();
  }

  if (!window.device) {
      console.log("No device, manually signalling ready");
      window.setTimeout(function () {
        ready();
      }, 100);
  }

  document.removeEventListener('deviceready', ready);
  document.addEventListener('deviceready', ready, true);
  

}(window.jmfw, window.mCapture));