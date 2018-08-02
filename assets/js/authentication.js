(function($, mc) {

    /**
	* Calls into the shell to set zumo credentials
	**/
	mc.fl.setupZumoAuthentication = function(callback, args) {
        var authUser = args[0];
        var authToken = args[1];

		function successCallback() {
			if (callback.constructor === Function) {
					callback(null);
			} else {
					callback.resume(null);
			}
		}
		function errorCallback(error) {
			if (callback.constructor === Function) {
					callback(error);
			} else {
					callback.resume(error);
			}
		}

		function successUserIdSet() {
			plugins.settings.setPreference(successCallback, errorCallback, "zumoUserToken", authToken);
		}

		plugins.settings.setPreference(successUserIdSet, errorCallback, "zumoUserId", authUser);
	}

} (window.jmfw, window.mCapture));
