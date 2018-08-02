/*jslint browser: true, devel: true, bitwise: true, continue: true, es5: true, evil: true, forin: true, nomen: true, plusplus: true, regexp: true, sloppy: true, white: true */
(function ($, mc) {
	var db, notImplemented, summariesCache, superSetDb, useIDb;

	function setDb(dbase) {
		log.debug('IN mc.IDB.setDb : ' + dbase);
		db = dbase;
		superSetDb(db);
	}

	/**
	 * Support old & new style transaction syntax
	 * 
	 * @param stores
	 *					Array of stores to give the new transaction access to.
	 * @param	access
	 *					Optional string containing access. Valid values are readonly,
	 *					readwrite, versionchange. If not supplied readonly is assumed
	 *
	 * @return	IDBTransaction object
	 */
	function getTx(stores, access) {
		var oldAccess, tx;
		try {
			if (window.IDBTransaction.hasOwnProperty('READ_WRITE')) {
				switch (access) {
				case 'readwrite':
					oldAccess = window.IDBTransaction.READ_WRITE;
					break;
				case 'versionchange':
					oldAccess = window.IDBTransaction.VERSION_CHANGE;
					break;
				default:
					oldAccess = window.IDBTransaction.READ_ONLY;
					break;
				}
				tx = db.transaction(stores, oldAccess);
				return tx;
			} 
			//debugger;
			if (access) {
				tx = db.transaction(stores, access);
			} else {
				tx = db.transaction(stores);
			}
			return tx;
		} catch (e) {
			log.error('getTx.catch : error getting IDB transaction object. Error ' + e + ' db : ' + JSON.stringify(db));
			// this is just a load of diagnostic crap
			// for any of it to work, getTx must be converted to an async function
			//debugger;
			var idbReq = indexedDB.open('mDesign');
			idbReq.onsuccess = function(event) {
				//debugger;
				log.debug('getTx.catch.onsuccess event : ' + JSON.stringify(event) + ' req : '  + JSON.stringify(idbReq));
				var newDb = this.result;
				var trans = newDb.transaction(stores, "readwrite");
				setDb(undefined);
				setDb(newDb);
				tx = trans;
				return tx;
			};
			idbReq.onerror = function (e) { 
				//debugger; 
				log.error('getTx.catch.onerror :  ' + JSON.stringify(e) + ' req : '  + JSON.stringify(idbReq));
				alert('getTx.catch.onerror' + e); 
			};
			idbReq.onupgradeneeded = function (e) { 
				//debugger; 
				log.error('getTx.catch.onupgradeneeded :  ' + JSON.stringify(e) + ' req : ' + JSON.stringify(idbReq));
				alert('getTx.catch.onupgradeneeded' + e); 
			};
			
		}
		throw('getTx : Unable to get IDB transaction');
	}

	/**
	* Public access to execute a sql query
	*/
	function executeQuery(sql, callback) {
		window.setTimeout(function () {
			callback(notImplemented);
		}, 0);
		sql = undefined;	// jslint
	}

	/**
	* Retrieve the saved subject matching the supplied subject guid
	*
	* @return	saved subject object
	*/
	function getSubjectInTransaction(tx, subjectGuid, callback, columns) {
		var currentSubject, request;
		currentSubject = mc.db._currentSubject();
		if (callback && typeof callback === 'function') {
			if (subjectGuid && subjectGuid.constructor === String) {
				if (!columns && currentSubject && subjectGuid === currentSubject.guid) {
					callback(tx, currentSubject.value);
				} else {
					request = tx.objectStore('subject').get(subjectGuid);
					request.onerror = function (e) {
						callback(undefined, {message: 'Error getting subject - TODO, inspect event for error information'});
						e = undefined;	// jslint
					};
					request.onsuccess = function (e) {
						if (columns) {
							if (e.target.result) {
								columns = e.target.result._summary;
								delete e.target.result._summary;
							} else {
								columns = {};
							}
							callback(tx, e.target.result, undefined, columns);
						} else {
							if (e.target.result) {
								delete e.target.result._summary;
							}
							callback(tx, e.target.result);
						}
					};
				}
			} else {
				callback(tx, subjectGuid);
			}
		}
	}

	function getSubject(subjectGuid, callback, columns) {

	  function cb() {
	    if (callback && typeof callback === 'function') {
	      var newArgs = Array.prototype.slice.call(arguments, 1);
	      callback.apply(this, newArgs);
	    }
	  }
		var tx;
		tx = getTx(['subject']);
		getSubjectInTransaction(tx, subjectGuid, cb, columns);
	}

	/**
	* Retrieve an object containing all of the installed process-versions which
	* have current subjects
	*
	* @param callback
	*					function to receive object containing a member for each processId. The
	*					name of the member id is the processId, the value of the member is an 
	*					array of strings, each string is an installed version of the respective 
	*					process.
	*/
	function getUsedProcessVersions(callback) {
		var tx, usedProcessVersions;
		if (callback && typeof callback === 'function') {
			usedProcessVersions = {};
			tx = getTx(['subject']);
			tx.oncomplete = function (e) {
				callback(usedProcessVersions);
				e = undefined;	// jslint
			};
			tx.onerror = function (e) {
				callback({});
				e = undefined;	// jslint
			};
			tx.objectStore('subject').index('processId').openCursor().onsuccess = function (e) {
				var cursor;
				cursor = e.target.result;
				if (cursor) {
					if (!cursor.value._meta.backupGuid) {
						if (usedProcessVersions[cursor.value._meta.processId] === undefined) {
							usedProcessVersions[cursor.value._meta.processId] = [cursor.value._meta.processVersion];
						} else if (usedProcessVersions[cursor.value._meta.processId].indexOf(cursor.value._meta.processVersion) === -1 ) {
							usedProcessVersions[cursor.value._meta.processId].push(cursor.value._meta.processVersion);
						}
					}
					cursor['continue']();
				}
			};
		}
	}

	/**
	* Delete the subject with the supplied guid. Ensure process integrity is
	* maintained.
	*
	* @param subjectGuid
	*					String containing guid of subject or subject object to delete
	* @param	keepAttachments
	*					If set attachments won't be deleted
	* @param	callback
	*					optional function called when deletion has completed. 1st parameter is
	*					an error object, if it's undefined then no error occurred.
	*/
	function _deleteSubjectInTransaction(tx, subjectGuid, keepAttachments, callback) {
	  var request = tx.objectStore('subject').delete(subjectGuid);
	  request.onerror = function (e) {
	    callback && callback({ message: 'Error deleting subject' });
	  };
	  request.onsuccess = function (e) {
	    if (!keepAttachments) {
	      var attRequest = tx.objectStore('attachment').index('subjectGuid').openCursor(subjectGuid);
	      attRequest.onerror = function (e) {
	        callback && callback({ message: 'Error deleting subject attachments' });
	      };
	      attRequest.onsuccess = function (e) {
	        var cursor = e.target.result;
			if (cursor) {
	          cursor.delete();
	          cursor.continue();
	        } else {
			summariesCache.clear();
	          callback && callback();
			}
		};
	    } else {
	      summariesCache.clear();
	      callback && callback();
			}
		};
		}

	function _deleteSubject(subjectGuid, keepAttachments, callback) {
		var tx;
		tx = getTx(['subject', 'attachment'], 'readwrite');
		_deleteSubjectInTransaction(tx, subjectGuid, keepAttachments, callback);
	}

	/**
	* Retrieve the saved attachment matching the supplied subject guid and name
	*
	* @return	saved subject object
	*/
	function getAttachment(subjectGuid, name, callback) {
		var data, tx;
		if (callback && typeof callback === 'function') {
			tx = getTx(['attachment']);
			tx.oncomplete = function (e) {
				callback(data);
				e = undefined;	// jslint
			};
			tx.onerror = function (e) {
				callback();
				e = undefined;	// jslint
			};
			tx.objectStore('attachment').index('subjectGuid').openCursor(subjectGuid).onsuccess = function (e) {
				var cursor;
				cursor = e.target.result;
				if (cursor) {
					if (cursor.value.name === name) {
						data = cursor.value.data;
					} else {
						cursor['continue']();
					}
				}
			};
		}
	}

	/**
	* Save the supplied attachment with the supplied subject guid and name
	*
	* @param	tx
	*					transaction object
	* @param	subjectGuid
	*					string containing unique guid of subject
	* @param	name
	*					name of attachment - must be unique for this subject
	* @param data
	*					data of attachment to save
	* @param callback
	*					optional function called on completion. 1st parameter is error object,
	*					if error object is undefined then the operation succeeded
	*/
	function setAttachmentInTransaction(tx, subjectGuid, name, data, markChanged, callback) {
		var o, store;
		function safeCallback(e) {
			if (callback) {
				callback(e);
			}
		}
		o = {
			subjectGuid: subjectGuid,
			name: name,
			data: data
		};
		store = tx.objectStore('attachment');
		store.index('subjectGuid').openCursor(subjectGuid).onsuccess = function (e) {
			var cursor, request;
			cursor = e.target.result;
			if (cursor) {
				if (cursor.value.name === name) {
					request = store.put(o, cursor.key);
				} else {
					cursor['continue']();
				}
			} else {
				request = store.add(o);
			}
			if (request) {
				request.onsuccess = function (e) {
					if (markChanged) {
						mc.replstore.store_attachment_date(subjectGuid, name, new Date());
					}
					safeCallback();
					e = undefined;	// jslint
				};
				request.onerror = function (e) {
					safeCallback({message: 'Error saving attachment'});
					e = undefined;	// jslint
				};
			}
		};
	}
	function setAttachment(subjectGuid, name, data, markChanged, callback) {
		var tx;
		tx = getTx(['attachment'], 'readwrite');
		setAttachmentInTransaction(tx, subjectGuid, name, data, markChanged, callback);
	}

	/**
	* Get a list of all attachments in the database
	*
	* @param	guid
	*					optional string containing the guid which to filter attachments for
	*
	* @return	array of all attachments, as {subjectGuid: guid, name: attachmentName}
	*/
	function getAttachmentList(guid, callback) {
		var attList, tx;
		function cursorSuccess(e) {
			var cursor;
			cursor = e.target.result;
			if (cursor) {
				attList.push({ subjectGuid: cursor.value.subjectGuid, name: cursor.value.name });
				cursor['continue']();
			} else {
				callback(attList);
			}
		}
		if (callback && typeof callback === 'function') {
			attList = [];
			tx = getTx(['attachment']);
			tx.onerror = function (e) {
				callback(undefined, {message: 'Error getting attachment list - TODO, inspect event for error information'});
				e = undefined;	// jslint
			};
			if (guid) {
				tx.objectStore('attachment').index('subjectGuid').openCursor(guid).onsuccess = cursorSuccess;
			} else {
				tx.objectStore('attachment').openCursor().onsuccess = cursorSuccess;
			}
		}
	}

	/**
	* Save the supplied subject with the supplied subject guid
	*
	* @param	transaction
	*					the existing DB transaction
	* @param	subjectGuid
	*					string containing unique guid of subject
	* @param	subject
	*					subject object to save
	* @param noTouch
	*					boolean indicating whether the modified field should not be updated
	* @param callback
	*					optional function called on completion. 1st parameter is error object,
	*					if error object is undefined then the operation succeeded
	* @param	columnValues
	*					optional array of column values to save
	*/
	function setSubjectInTransaction(tx, subjectGuid, subject, noTouch, callback, columnValues) {
		var clone, i, p, request;
		subjectGuid = mc.db.getSubjectGuid(subjectGuid);
		if (noTouch !== true) {
			subject._meta.modified = new Date();
			mc.db.ensureReplDataPresent(subject);
			subject._meta.syncInfo.cseq++;
		}
		if (columnValues) {
			clone = {};
			for (p in subject) {
				if (subject.hasOwnProperty(p)) {
					clone[p] = subject[p];
				}
			}
			clone._summary = {};
			for (i = 0; i < columnValues.length; i += 1) {
				if (columnValues[i] !== undefined && columnValues[i] !== null) {
					clone._summary['col' + i] = columnValues[i];
				}
			}
		} else {
			clone = subject;    // No need to clone if there's no supplied columnValues
		}
		// put clone into the subject objectStore
		request = tx.objectStore('subject').put(clone);
		request.onerror = function (e) {
			if (callback) {
				callback({ message: "Does oncomplete get called even if there's an error" });
			}
			e = undefined;	// jslint
		};
		request.onsuccess = function (e) {
		    var process, processName;
			summariesCache.clear();
			processName = mc.db.makeProcessName({ id: subject._meta.processId, version: subject._meta.processVersion || mc.db.getLatestProcessVersion(subject._meta.processId) });
			process = mc.db.getProcess(processName);
			if (process && subjectGuid !== process.visualizationSubjectGuid) {
                process.subjectGuids.push(subjectGuid);
            }
            if (mc.db._currentSubject() && mc.db._currentSubject().guid === subjectGuid) {
                mc.db._currentSubject({ guid: subjectGuid, value: clone });
            }
			if (callback) {
				callback();
			}
			e = undefined;	// jslint
		};
	}
	function setSubject(subjectGuid, subject, noTouch, callback, columnValues) {
		var tx;
		tx = getTx(['subject'], 'readwrite');
		setSubjectInTransaction(tx, subjectGuid, subject, noTouch, callback, columnValues);
	}

	/**
	* Create/open the indexedDB, subject & attachment stores and indeces. Upgrade
	* to current version.
	*
	* @param	success
	*					function called when database has been successfully opened and upgraded
	*					to the current version
	* @param error
	*					function called when a database error has occurred
	*/
	function createDb(success, error) {
        log.debug('IN mc.IDB.createDb');
		var request, setVersionRequest, version = 19, o = { delay: '' }, upgraded = false;
		function exit(e) {
			log.debug('IN mc.IDB.createDb.exit : ' + JSON.stringify(e));
			if (e) {
				setDb(undefined);
				error(e);
			} else  {
				success();
			}
		}
		function reopenDb(originalDb) {
			//KLUDGE - For some reason the database is left in an unusable state after the stores and indexes have been added
			//Reopening the database seems to fix that
			//Dont set the global db until be have reopened
			log.debug('IN mc.IDB.createDb.reopenDb : ' + db + ' originalDb : ' + originalDb);
			//debugger;
			if (!db) {
				var idbReq = indexedDB.open('mDesign');
				idbReq.onsuccess = function(event) {
					//debugger;
					setDb(this.result);
					exit();
				};
				idbReq.onerror = function (e) { 
					//debugger; 
					exit({ message: 'onerror: ' + idbReq.error.toString() });
				};
				idbReq.onupgradeneeded = function (e) { 
					//debugger; 
					exit({ message: 'onupgradeneeded: ' + idbReq.error.toString() });
				};
			} else {
				exit();
			}
		}
		function upgradeNeeded(db) {
			log.debug('IN mc.IDB.createDb.upgradeNeeded');
			var i, index, key, store;
			if (db.objectStoreNames.contains('subject')) {
				log.debug('mc.IDB.createDb.upgradeNeeded : delete subject');
                o.delay = '500';
                MCAPTURE_ProcessProvisioned(o);
				db.deleteObjectStore('subject');
			}
			if (db.objectStoreNames.contains('attachment')) {
				log.debug('mc.IDB.createDb.upgradeNeeded : delete attachment');
                o.delay = '400';
                MCAPTURE_ProcessProvisioned(o);
				db.deleteObjectStore('attachment');
			}
			if (!db.objectStoreNames.contains('subject')) {
				log.debug('mc.IDB.createDb.upgradeNeeded : create subject');
                o.delay = '300';
                MCAPTURE_ProcessProvisioned(o);
				store = db.createObjectStore('subject', { keyPath: '_meta.guid' });
				log.debug('mc.IDB.createDb.upgradeNeeded : create basic index');
				index = store.createIndex('processId', '_meta.processId', { unique: false });
				index = store.createIndex('processVersion', '_meta.processVersion', { unique: false });
				index = store.createIndex('type', '_meta.type', { unique: false });
				index = store.createIndex('backupGuid', '_meta.backupGuid', { unique: false });
				index = store.createIndex('serverId', '_meta.syncInfo.ServerId', { unique: false });
				index = store.createIndex('created', '_meta.created', { unique: false });
				index = store.createIndex('modified', '_meta.modified', { unique: false });
				log.debug('mc.IDB.createDb.upgradeNeeded : create extended index');
				for (i = 0; i < 30; i += 1) {	// IE10 Release Preview seems to have a limit of 34 here ???
					o.delay = '200';
					MCAPTURE_ProcessProvisioned(o);
					key = 'col' + i;
					index = store.createIndex(key, '_summary.' + key, { unique: false });
				}
			}
			if (!db.objectStoreNames.contains('attachment')) {
				log.debug('mc.IDB.createDb.upgradeNeeded : create attachment');
                o.delay = '100';
                MCAPTURE_ProcessProvisioned(o);
				//store = db.createObjectStore('attachment', { keyPath: ['subjectGuid', 'name'] });	// Array keyPaths not yet supported in Chrome
				store = db.createObjectStore('attachment', { autoIncrement: true });
				index = store.createIndex('subjectGuid', 'subjectGuid', { unique: false });
				index = store.createIndex('name', 'name', { unique: false });
			}
		}
		
		if (db) {
			reopenDb(db);
		} else {
		    log.debug('mc.IDB.createDb : open database');
		    request = window.indexedDB.open('mDesign', version);
		    request.onerror = function (e) {
			    log.debug('IN mc.IDB.createDb.onerror : ' + e);
			    exit({ message: request.error.toString() });
			    e = undefined;	// jslint
		    };
		    request.onsuccess = function (e) {
			    log.debug('IN mc.IDB.createDb.onsuccess : ' + e);
			    if (upgraded) {
			        reopenDb();
			    } else {
			        setDb(request.result);
				    exit();
			    }
			    e = undefined;	// jslint
		    };
		    request.onupgradeneeded = function (e) {
			    log.debug('IN mc.IDB.createDb.onupgradeneeded : ' + e);
			    upgradeNeeded(e.target.result);
			    upgraded = true;
		    };
		}
	}

	/**
	* Backup the current subject
	*
	* @param	callback
	*					function called back when subject has been backed up. 1st parameter is
	*					object containing the backed up subject
	*
	*	N.B.	Ken says this functionality will be removed so there's no need to 
	*				implement it.
	*/
	function backupCurrentSubject(callback) {
		callback(notImplemented);
	}

	/**
	* Delete all data in the database
	*/
	function clear(success, error) {
		var tx;
		tx = getTx(['subject', 'attachment'], 'readwrite');
		tx.oncomplete = function (e) {
			success();
			e = undefined;	// jslint
		};
		tx.onerror = function (e) {
			error({ message: 'Error clearing database - inspect event for error details' });
			e = undefined;	// jslint
		};
		tx.objectStore('subject').clear();
		tx.objectStore('attachment').clear();
	}

	/**
	* Retrieve all the subject guids belonging to the supplied processId and
	* process version
	*
	* @param processId
	*					optional String containing the processId to use on the query
	* @param processVerions
	*					optional String containing the processVersion to use in the query
	* @param callback
	*					function to receive the array of guids
	*/
	function getSubjectGuids(processId, processVersion, callback) {
		var guids, tx;
		function done() {
			callback(guids);
		}
		if (callback && typeof callback === 'function') {
			guids = [];
			if (db) {
				tx = getTx(['subject']);
				tx.oncomplete = done;
				tx.onerror = done;
				tx.objectStore('subject').index('processId').openCursor(processId).onsuccess = function (e) {
					var cursor;
					cursor = e.target.result;
					if (cursor) {
						if (!cursor.value._meta.backupGuid) {
							if (!processVersion || processVersion === cursor.value._meta.processVersion) {
								guids.push(cursor.value._meta.guid);
							}
						}
						cursor['continue']();
					}
				};
			} else {
				done();
			}
		}
	}

	/**
	* Delete the attachment with the supplied subject guid and name.
	*
	* @param subjectGuid
	*					String containing guid of subject to delete
	* @param	name
	*					String containing the name of the attachment
	* @param	callback
	*					optioanl function called when deletion has completed. 1st parameter is
	*					an error object, if it's undefined then no error occurred.
	*/
	function deleteAttachmentInTransaction(tx, subjectGuid, name, callback) {
		var store;
		function safeCallback(e) {
			if (callback) {
				callback(e);
			}
		}
		store = tx.objectStore('attachment');
		store.index('subjectGuid').openCursor(subjectGuid).onsuccess = function (e) {
			var cursor, request;
			cursor = e.target.result;
			if (cursor && cursor.value.name === name) {
				request = store.delete(cursor.key);
				request.onsuccess = function (e) {
					safeCallback();
				};
				request.onerror = function (e) {
					safeCallback({message: 'Error deleting attachment'});
				};
			} else {
			  safeCallback();
			}
		};
	}
	function deleteAttachment(subjectGuid, name, callback) {

	  function cb() {
	    if (callback && typeof callback === 'function') {
	      var newArgs = Array.prototype.slice.call(arguments, 1);
	      callback.apply(this, newArgs);
	    }
	  }

		var tx;
		tx = getTx(['attachment'], 'readwrite');
		deleteAttachmentInTransaction(tx, subjectGuid, name, cb);
	}

	/**
	* Retrieve the subject guids belonging to the supplied processId and
	* syncId
	*
	* @param processId
	*					String containing the processId to use on the query
	* @param syncId
	*					String containing the syncId to use in the query
	* @param callback
	*					function to receive the guid
	*/
	function getSubjectGuidFromReplID(processId, syncId, callback) {
		var guid, tx, version;
		function done() {
			callback(guid || '');
		}
		if (callback && typeof callback === 'function') {
			if (db) {
				tx = getTx(['subject']);
				tx.oncomplete = done;
				tx.onerror = done;
				tx.objectStore('subject').index('processId').openCursor(processId).onsuccess = function (e) {
					var cursor, value;
					cursor = e.target.result;
					if (cursor) {
						value = cursor.value;
						if (!value._meta.backupGuid) {
							if (!syncId || (value._meta.syncInfo && value._meta.syncInfo.ServerId === syncId)) {
								if (!version || version <= cursor.value._meta.processVersion) {
									version = cursor.value._meta.processVersion;
									guid = cursor.value._meta.guid;
								}
							}
						}
						cursor['continue']();
					}
				};
			} else {
				done();
			}
		}
	}

	/**
	* Retrieve the supplied summaries for all the subjects belonging to the
	* supplied processId and process version
	*
	* @param processId
	*					Array of Strings or String containing the processId to use on the query
	* @param processVerions
	*					optional Array of Strings or String containing the processVersion to use
	*					in the query
	* @param	summaryNames
	*					Array of summary names to resolve into column ordinals
	* @param callback
	*					function to receive the array of guids
	*/
	function getSubjectSummaries(processId, processVersion, summaryNames, filter, callback) {
		var i, index, summaries, tx;
		function getSummaries(processId, processVersion) {
			var i, process, processName, v;
			processName = mc.db.makeProcessName({ id: processId, version: processVersion || mc.db.getLatestProcessVersion(processId) });
			process = mc.db.getProcess(processName);
			i = process.summaryMap.indexOf(summaryNames[0]);
			index.openCursor(processId).onsuccess = function (e) {
				var col, cursor, include, o, p;
				cursor = e.target.result;
				if (cursor) {
					if (!processVersion || processVersion === cursor.value._meta.processVersion) {
						include = true;
						for (p in filter) {
							if (filter.hasOwnProperty(p)) {
								index = process.summaryMap.indexOf(p);
								if (index >= 0) {
									v = mc.db.getValue(filter[p]);
									if (v !== undefined && v !== null && v !== '') {
										if (!cursor.value._summary || cursor.value_summary['col' + index] !== v) {
											include = false;
											break;
										}
									}
								}
							}
						}
						if (include) {
							o = {};
							o.guid = cursor.value._meta.guid;
							o.processId = processId;
							for (i = 0; i < summaryNames.length; i += 1) {
								col = process.summaryMap.indexOf(summaryNames[i]);
								if (cursor.value._summary) {
									o[summaryNames[i]] = cursor.value._summary['col' + col];
								} else {
									o[summaryNames[i]] = 'undefined - please fix your summary item formula';								
								}
							}	
							summaries.push(o);
						}
					}
					cursor['continue']();
				}
			};
		}
		summaries = [];
		if (db && callback && typeof callback === 'function') {
			tx = getTx(['subject']);
			tx.oncomplete = function (e) {
                // sort results on the summaryNames until we build this into the idb index
                summaries.sort(function(a, b) {
                    for (i = 0; i < summaryNames.length; i++) {
                        if (a[summaryNames[i]] == null) return -1;
                        if (b[summaryNames[i]] == null) return 1;
                        if (a[summaryNames[i]].toLowerCase() > b[summaryNames[i]].toLowerCase()) return 1;
                        if (a[summaryNames[i]].toLowerCase() < b[summaryNames[i]].toLowerCase()) return -1;
                    }
                    return 0;
                });
				callback(summaries);
				e = undefined;	// jslint
			};
			tx.onerror = function (e) {
				callback(summaries);
				e = undefined;	// jslint
			};
			if (!processId || processId.constructor !== Array) {
				processId = [processId];
			}
			if (!processVersion || processVersion.constructor !== Array) {
				processVersion = [processVersion];
			}
			index = tx.objectStore('subject').index('processId');
			for (i = 0; i < processId.length; i += 1) {
				getSummaries(processId[i], processVersion[i]);
			}
		}
	}

	/**
	* Make a cached summaries array.
	*/
	function createSummariesCache() {
		var cache;
		function clear() {
			cache = {
				processId: undefined,
				conditions: undefined,
				distinct: undefined,
				sort: undefined,
				data: []
			};
		}
		function needsRefresh(processId, conditions, distinct, sort) {
			var i, p;
			if (cache.processId !== processId || cache.distinct !== distinct) {
				return true;
			}
			if (sort) {
				if (!cache.sort || cache.sort.order !== sort.order || cache.sort.column !== sort.column) {
					return true;
				}
			}
			if (conditions) {
				if (cache.conditions && conditions.length === cache.conditions.length) {
					for (i = 0; i < conditions.length; i += 1) {
						for (p in conditions[i]) {
							if (conditions[i].hasOwnProperty && conditions[i][p] !== cache.conditions[i][p]) {
								return true;
							}
						}
					}
				} else {
					return true;
				}
			} else if (cache.conditions) {
				return true;
			}
			return false;
		}
		function getData(processId, summaryNames, conditions, distinct, sort, callback) {
			var process, processName, sortColumn, tx;
			function match(values) {
			    var i, lhs, rhs;
			    if (!conditions || !conditions.length) {
			        return false;
			    }
			    for (i = 0; i < conditions.length; i += 1) {
			        lhs = values[conditions[i].summaryName] && values[conditions[i].summaryName].toLowerCase();
			        rhs = conditions[i].value && conditions[i].value.toLowerCase();
			        switch (conditions[i].condition) {
			            case 'begins':
			                if (!lhs || lhs.indexOf(rhs) !== 0) {
			                    return false;
			                }
			                break;
			            case 'ends':
			                if (!lhs || lhs.lastIndexOf(rhs) !== lhs.length - rhs.length) {
			                    return false;
			                }
			                break;
			            case 'contains':
			                if (!lhs || lhs.indexOf(rhs) === -1) {
			                    return false;
			                }
			                break;
			            default:
			                if (lhs !== rhs) {
			                    return false;
			                }
			                break;
			        }
			    }
			    return true;
			}
			if (needsRefresh(processId, conditions, distinct, sort)) {
				clear();
				cache.processId = processId;
				cache.conditions = conditions;
				cache.distinct = distinct;
				cache.sort = sort;
				processName = mc.db.makeProcessName({ id: processId, version: mc.db.getLatestProcessVersion(processId) });
				process = mc.db.getProcess(processName);
				if (sort && sort.column) {
				    sortColumn = 'col' + process.summaryMap.indexOf(sort.column);
				}
				tx = getTx(['subject']);
				tx.onerror = function (e) {
					callback([]);
					e = undefined;	// jslint
				};
				tx.oncomplete = function (e) {
					cache.data.sort(function (l, r) {
						var n;
						if (sort.order === 'desc') {
							n = r.sortValue.localeCompare(l.sortValue);
						} else {
							n = l.sortValue.localeCompare(r.sortValue);
						}
						return n;
					});
					callback(cache.data);
					e = undefined;	// jslint
			};
				tx.objectStore('subject').index('processId').openCursor(processId).onsuccess = function (e) {
					var c, cursor, i, o;
					cursor = e.target.result;
					if (cursor) {
						if (!cursor.value._meta.backupGuid) {
							o = {};
							o.guid = cursor.primaryKey;
							if (sortColumn && cursor.value._summary) {
								o.sortValue = cursor.value._summary[sortColumn];
							} else {
								o.sortValue = o.guid;
							}
							o.values = {};
							for (i = 0; i < summaryNames.length; i += 1) {
								c = "col" + process.summaryMap.indexOf(summaryNames[i]);
								if (cursor.value._summary) {
									o.values[summaryNames[i]] = cursor.value._summary[c];
								}
							}
							if (match(o.values)) {
								cache.data.push(o);
							}
						}
						cursor['continue']();
					}
				};
			} else {
				callback(cache.data);
			}
		}
		clear();
		return {
			clear: clear,
			getData: getData
		};
	}
	function querySummaries(processId, summaryNames, conditions, distinct, sort, limit, offset, callback) {
		function gotSummaries(summaries) {
			var a, i, j, o, start;
			a = [];
			if (summaries && summaries.length) {
				start = 0;
				if (offset) {
					start += offset;
				}
				if (start < summaries.length) {
					for (i = 0; (limit < 0 || i < limit) && (i + start) < summaries.length; i += 1) {
						o = {};
						o.guid = summaries[i + start].guid;
						for (j = 0; j < summaryNames.length; j += 1) {
							o[summaryNames[j]] = summaries[i + start].values[summaryNames[j]];
						}
						a.push(o);
					}
				}
			}
			callback(a);
		}
		if (callback && callback.constructor === Function) {
			summariesCache.getData(processId, summaryNames, conditions, distinct, sort, gotSummaries);
		}
	}

	/**
	* Query summaries in a compressed or uncompressed dataset
	*
	* @param processId
	* @param options object
	*			filters - an optional array of filters: ([{summaryName: 'x', summaryValue: 'y'},{...}])
	*			conditions - an optional array of conditions: ([{condition: 'contains', summaryName: 'x', value: 'y'},{...}])
	*		    summaryName - optional string: show only summaries that match this summaryName
	*			summaryNames - optional array: show only summaries that match one of these summaryNames
	*			unique/distinct - optional boolean, show only unique entries (non-compessed only atm)
	*			choices - optional boolean: provide results in the form expected by dynamic choices
	* @param callback
	*
	*/
	function summaryQuery(processId, options, callback) {
	    var proc, compressed, separator, summaryNames;

	    function makeChoices(result) {
	        var choicedResults = [];
	        $.each(result, function(index, item) {
	            var summaryValueLabel,
    			summaryValueValue,
    			choiceText;
	            choiceText = item[summaryNames[0]];
	            summaryValueLabel = choiceText;
	            summaryValueValue = choiceText;
	            if (separator !== undefined && separator.length > 0 && choiceText.indexOf(separator) >= 0 && choiceText.indexOf(separator) < choiceText.length) {
	                summaryValueLabel = choiceText.substring(0, choiceText.indexOf(separator));
	                summaryValueValue = choiceText.substring(1 + choiceText.indexOf(separator));
	            }
	            choicedResults.push({
	                label: summaryValueLabel,
	                value: summaryValueValue
	            });
	        });

	        return choicedResults;
	    }

	    function containsRow(array, row) {
	        var keys = Object.keys(row);
	        return array.some(function (other) {
	            return keys.every(function (key) {
	                return row[key] === other[key];
	            });
	        });
	    }

	    function decompressXML(xml) {
	        var xml = '<xml>' + xml + '</xml>';
	        var x2js = new X2JS();
	        var jsonObj = x2js.xml_str2json(xml);
	        // console.dir(jsonObj);

	        var summaryNames = options.summaryNames;
	        if (typeof summaryNames == 'string' || summaryNames instanceof String) {
	            summaryNames = [summaryNames];
	        }
	        if (options.summaryName) {
	            summaryNames = [options.summaryName];
	        }

	        var result = [];

	        $.each(jsonObj.xml.row, function(index, row) {

	            function strStartsWith(str, prefix) {
	                return str.indexOf(prefix) === 0;
	            }

	            function strEndsWith(str, suffix) {
	                return str.match(suffix + "$") == suffix;
	            }

	            function strContains(str, contained) {
	                return str.indexOf(contained) >= 0;
	            }

	            var filteredOut = false;

	            if (options && options.filters && (typeof options.filters == 'array' || options.filters instanceof Array)) {
	                $.each(options.filters, function(index, filter) {
	                    if (typeof filter.summaryValue == 'array' || filter.summaryValue instanceof Array) {
	                        if (row['_' + filter.summaryName] !== filter.summaryValue[0]) {
	                            filteredOut = true;
	                        }
	                    } else if (row['_' + filter.summaryName] !== filter.summaryValue) {
	                        filteredOut = true;
	                    }
	                });
	            }

	            if (options && options.conditions && (typeof options.conditions == 'array' || options.conditions instanceof Array)) {
	                $.each(options.conditions, function(key, condition) {
	                    switch (condition.condition) {
	                        case 'begins':
	                            {
	                                if (!strStartsWith(row['_' + condition.summaryName], condition.value))
	                                    filteredOut = true;
	                                break;
	                            }
	                        case 'ends':
	                            {
	                                if (!strEndsWith(row['_' + condition.summaryName], condition.value))
	                                    filteredOut = true;
	                                break;
	                            }
	                        case 'contains':
	                            {
	                                if (!strContains(row['_' + condition.summaryName], condition.value))
	                                    filteredOut = true;
	                                break;
	                            }
	                        default:
	                            {
	                                if (row['_' + condition.summaryName] !== condition.value)
	                                    filteredOut = true;
	                                break;
	                            }
	                    }
	                });
	            }

	            if (filteredOut)
	                return true; // continue

	            var dataRow = {};
	            if (!summaryNames) {
	                $.each(row, function(key, summaryVal) {
	                    dataRow[key.substring(1)] = summaryVal;
	                });
	            } else if (typeof summaryNames == 'array' || summaryNames instanceof Array) {
	                $.each(summaryNames, function(idx, summaryName) {
	                    dataRow[summaryName] = row['_' + summaryName];
	                });
	            } else {
	                console.error('summaryNames option not valid');
	            }
	            var found = false;
	            if (options.unique || options.distinct) {
	                $.each(result, function(index, res) {
	                    var match = true;
	                    $.each(summaryNames, function(idx, summName) {
	                        if (dataRow[summName] !== res[summName])
	                            match = false;
	                    });
	                    if (match)
	                        found = true;
	                });
	            }
	            if (!found)
	                result.push(dataRow);
	        });

	        // console.dir(result);

            sortResult(result);

	        if (options.choices) {
	            if (callback) {
	                callback(makeChoices(result));
	            }
	            return;
	        }

	        if (callback) {
	            callback(result);
	        }
	    }

	    function summaryQueryCompressed() {
	        var colName, xml;

	        // Fetch the XML from the dataset
	        colName = 'col' + proc.summaryMap.indexOf('__CD__Data');
			
			tx = getTx(['subject']);
			tx.onerror = function (e) {
				callback([]);
				e = undefined;	// jslint
			};
			tx.oncomplete = function (e) {
			    if (xml !== undefined) {
				    decompressXML(xml);
				} else {
					// done but nothing returned
    				callback([]);
				}
				e = undefined;	// jslint
			};
			
			tx.objectStore('subject').index('processId').openCursor(processId).onsuccess = function (e) {
				var col, cursor, i, include, v;
				cursor = e.target.result;
				if (cursor) {
					if (!cursor.value._meta.backupGuid && cursor.value._summary) {
						xml = cursor.value._summary[colName];						
					}
				}
			};
	    }

	    function summaryQueryUncompressed() {
	        var colName, 
                distinct = options.unique || options.distinct,
                a = [];
			
			tx = getTx(['subject']);
			tx.onerror = function (e) {
				callback([]);
				e = undefined;	// jslint
			};
			tx.oncomplete = function (e) {
			    if (a !== undefined) {

                    sortResult(a);

					if (options.choices) {					
						callback(makeChoices(a));					
						return;
					} else {
						callback(a);
						return;
					}
				} else {
					// done but nothing returned
    				callback([]);
				}
				e = undefined;	// jslint
			};
			
			tx.objectStore('subject').index('processId').openCursor(processId).onsuccess = function (e) {
				var col, cursor, i, include, v, pos;
				cursor = e.target.result;
				if (cursor) {
					if (!cursor.value._meta.backupGuid && cursor.value._summary) {
						include = true;
						if (options.conditions && options.conditions.length) {
							$.each(options.conditions,
								function (index, condition) {
									if (include) {
										pos = proc.summaryMap.indexOf(condition.summaryName);
										if (pos >= 0) {

											col = "col" + pos.toString();
											v = cursor.value._summary[col];
											if (v !== undefined) {
												if (Object.prototype.toString.call(condition.value) === '[object Array]') {
													switch (condition.condition) {
														case 'begins':
															if (v.indexOf(condition.value[0]) !== 0) {
																include = false;
															}
															break;
														case 'ends':
															if (v.lastIndexOf(condition.value[0]) !== Math.abs(v.length - condition.value[0].length)) {
																include = false;
															}
															break;
														case 'contains':
															if (v.indexOf(condition.value[0]) < 0) {
																include = false;
															}
															break;
														default:
															if (v !== condition.value[0]) {
																include = false;
															}
															break;
													}
												} else {
													switch (condition.condition) {
														case 'begins':
															if (v.indexOf(condition.value) !== 0) {
																include = false;
															}
															break;
														case 'ends':
															if (v.lastIndexOf(condition.value) !== Math.abs(v.length - condition.value.length)) {
																include = false;
															}
															break;
														case 'contains':
															if (v.indexOf(condition.value) < 0) {
																include = false;
															}
															break;
														default:
															if (v !== condition.value) {
																include = false;
															}
															break;
													}
												}
											} else {
												include = false;
											}
										} else {
											include = false;
										}
									}
								}
							)
						} else {
							if (options.filters && options.filters.length) {
								$.each(options.filters, function (index, filter) {
									if (include) {
										pos = proc.summaryMap.indexOf(condition.summaryName);
										if (pos >= 0) {
											col = "col" + pos.toString();
											v = cursor.value._summary[col];
											if (v !== undefined) {
												if (Object.prototype.toString.call(filter.summaryValue) === '[object Array]') {
													if (v !== filter.summaryValue[0]) {
														include = false;
													}
												} else {
													if (v !== filter.summaryValue) {
														include = false;
													}
												}
											} else {
												include = false;
											}
										} else {
												include = false;
										}
									}
								});
							}
						}
						if (include) {
						    var dataRow = {};
						    if (!distinct) {
						        dataRow.guid = cursor.value._meta.guid;
						    }
						    if (!summaryNames) {
						        $.each(cursor.value._summary, function(key, summaryVal) {
						            dataRow[key.substring(1)] = summaryVal;
						        });
						    } else if (typeof summaryNames == 'array' || summaryNames instanceof Array) {
						        $.each(summaryNames, function(idx, summaryName) {
						            dataRow[summaryName] = cursor.value._summary['col' + proc.summaryMap.indexOf(summaryName)];
						        });
						    } else {
						        console.error('summaryNames option not valid');
						    }
						
						    if (!distinct || !containsRow(a, dataRow)) {
						        a.push(dataRow);
						    }
						}						
					}
					if( !options.limit || a.length < options.limit ) {
						cursor['continue']();					
					}
				}
			};
	    }

        function sortResult(result) {
            var sortColumn, sortOrder, compareFunction;
            sortColumn = (options.sort && options.sort.column) || summaryNames[0];
            sortOrder = (options.sort && options.sort.order) || 'asc';
            if (sortOrder.toLowerCase() == 'desc') {
                compareFunction = function(b, a) {
                    return a[sortColumn].localeCompare(b[sortColumn]);
                }
            } else {
                compareFunction = function(a, b) {
                    return a[sortColumn].localeCompare(b[sortColumn]);
                }
            }
            result.sort(compareFunction);
        }

	    proc = mCapture.db.getProcess(mCapture.db.makeProcessName({
	        id: processId,
	        version: mc.db.getLatestProcessVersion(processId)
	    }));
	    if (!proc) {
	        log.error("Couldn't find dataset: " + processId);
	        callback();
	        return;
	    }
	    compressed = !proc.isaprocess && proc.pages.DATA.qIdMap.__CD__Data && proc.pages.DATA.qIdMap.__CD__Data === '__CD__Data';
	    separator = '';
	    if (proc !== undefined && proc.separator !== undefined) {
	        separator = proc.separator;
	    }

        summaryNames = options.summaryNames || options.summaryName;
        if (!summaryNames) {
            summaryNames = proc.summaryMap;
        }
        if (typeof summaryNames == 'string' || summaryNames instanceof String) {
            summaryNames = [summaryNames];
        }

	    if (compressed) {
	        summaryQueryCompressed();
	    } else {
	        summaryQueryUncompressed();
	    }
	}

	/**
	*
	*/
	function querySummaryData(processId, summaryItemName, filters, distinct, separator, callback) {
		var a, colName, process, processName, tx;
		a = [];
		if (callback && callback.constructor === Function) {
			processName = mc.db.makeProcessName({ id: processId, version: mc.db.getLatestProcessVersion(processId) });
			process = mc.db.getProcess(processName);
			colName = "col" + process.summaryMap.indexOf(summaryItemName);
			tx = getTx(['subject']);
			tx.onerror = function (e) {
				callback([]);
				e = undefined;	// jslint
			};
			tx.oncomplete = function (e) {
			    if (a !== undefined) {
				    callback(a);
				} else {
				// done but nothing returned
    				callback([]);
				}
				e = undefined;	// jslint
			};
			tx.objectStore('subject').index('processId').openCursor(processId).onsuccess = function (e) {
				var col, cursor, i, include, v;
				cursor = e.target.result;
				if (cursor) {
					if (!cursor.value._meta.backupGuid && cursor.value._summary) {
						include = true;
						if (filters && filters.length) {
							for (i = 0; i < filters.length + 1; i += 2) {
								col = "col" + process.summaryMap.indexOf(filters[i]);
								v = cursor.value._summary[col];
								if (separator !== undefined && separator === 1) {
									if (!v || v.indexOf(separator + filters[i + 1]) !== 0) {
										include = false;
									}
								} else {
									if (v !== filters[i + 1]) {
										include = false;
									}
								}
							}
						}
						if (include) {
							v = cursor.value._summary[colName];
							if (!distinct || a.indexOf(v) === -1) {
								a.push(v);
							}
						}
					}
					cursor['continue']();
				}
			};
		}
	}

	/**
	*
	*/
	function startTransaction(callback, completed_callback) {
		var tx;
		log.debug("Starting Transaction");
		tx = getTx(['subject', 'attachment'], 'readwrite');
		tx.onerror = function (e) {
			log.error("Transaction Failed: inspect e to find out what error information is available");
			e = undefined;	// jslint
		};
		tx.oncomplete = function (e) {
			log.debug("Transaction completed OK");
			completed_callback(tx);
			e = undefined;	// jslint
		};
		callback(tx);
	}

    /*
     * Subject validation 'overrides' of mc.db.validate_xxx
     */

	function validate_openDatabase(callback) {
	    var request = window.indexedDB.open('mDesign');
	    request.onsuccess = function () {
	        callback(null, request.result);
	    };
	    request.onerror = function (error) {
	        callback(error);
	    };
	}

	function validate_getSubject(db, subjectGuid, columns, callback) {
        var transaction = db.transaction('subject', 'readwrite'),
	        request = transaction.objectStore('subject').get(subjectGuid);

        request.onsuccess = function() {
            var result = request.result;
            if (columns) {
                if (result) {
                    columns = result._summary;
                    delete result._summary;
                } else {
                    columns = {};
                }
                callback(null, result, columns);
            } else {
                if (result) {
                    delete result._summary;
                }
                callback(null, result);
            }
        };

        request.onerror = function (error) {
            callback(error);
        };
	}

    
	function validate_deleteSubject(db, subjectGuid, callback) {
	    var transaction = db.transaction(['subject', 'attachment'], 'readwrite'),
            request = transaction.objectStore('subject').delete(subjectGuid);

	    request.onsuccess = function () {
	        var request = transaction.objectStore('attachment').index('subjectGuid').openCursor(subjectGuid);

	        request.onsuccess = function () {
	            var cursor = request.result;
	            if (cursor) {
	                cursor.delete();
	                cursor.continue();
	            } else {
	                summariesCache.clear();
	                callback();
	            }
	        };

	        request.onerror = function (error) {
	            callback(error);
	        };
	    };

	    request.onerror = function (error) {
	        callback(error);
	    };
	}

    /*
     * Replace WebSQL if not available
     */
	useIDb = !window.openDatabase;
	if (useIDb) {
		window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
		if (window.indexedDB) {
			summariesCache = createSummariesCache();
			window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
			notImplemented = {
				code: -1,
				message: 'Not Implemented'
			};
			if (window.indexedDB) {
				mc.db.backupCurrentSubject = backupCurrentSubject;
				mc.db.clear = clear;
				mc.db.createDb = createDb;
				mc.db.deleteAttachment = deleteAttachment;
				mc.db.deleteAttachmentInTransaction = deleteAttachmentInTransaction;
				mc.db._deleteSubject = _deleteSubject;
				mc.db._deleteSubjectInTransaction = _deleteSubjectInTransaction;
				mc.db.executeQuery = executeQuery;
				mc.db.getAttachment = getAttachment;
				mc.db.getAttachmentList = getAttachmentList;
				mc.db.getSubject = getSubject;
				mc.db.getSubjectGuidFromReplID = getSubjectGuidFromReplID;
				mc.db.getSubjectGuids = getSubjectGuids;
				mc.db.getSubjectSummaries = getSubjectSummaries;
				mc.db.getSubjectInTransaction = getSubjectInTransaction;
				mc.db.getUsedProcessVersions = getUsedProcessVersions;
				mc.db.querySummaries = querySummaries;
				mc.db.querySummaryData = querySummaryData;
				mc.db.summaryQuery = summaryQuery;
				mc.db.startTransaction = startTransaction;
				mc.db.setAttachment = setAttachment;
				mc.db.setAttachmentInTransaction = setAttachmentInTransaction;
				superSetDb = mc.db.setDb;
				mc.db.setDb = setDb;
				mc.db.setSubject = setSubject;
				mc.db.setSubjectInTransaction = setSubjectInTransaction;
				mc.db.validate_openDatabase = validate_openDatabase;
			    mc.db.validate_getSubject = validate_getSubject;
			    mc.db.validate_deleteSubject = validate_deleteSubject;
			}
		}
	}

} (window.jmfw, window.mCapture));
/*
** END OF MC2.IDB.JS
*/﻿(function($, mc) {

	var mcversion = 'jenkins-8.1.492';


	function ready() {
		// Use the "ready" function to set the code version
		//debugger;
		mc = mCapture;
		mc.version.setversion('idb', mcversion);
	}

	// Listen for the mcready event
	window.document.addEventListener('mcready', ready, false);

} (window.jmfw, window.mCapture));
/*
** END OF VERSION.IDB.JS
*/
