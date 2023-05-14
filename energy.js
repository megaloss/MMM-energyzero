/* global Module */

/* Magic Mirror
 * Module: buien
 *
 * By 
 * MIT Licensed.
 */

Module.register("energy", {
	defaults: {
		updateInterval: 120000,
		retryDelay: 5000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;

		// Schedule update timer.
		this.getData();
		setInterval(function() {
			self.updateDom();
		}, this.config.updateInterval);
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function() {
		var self = this;

		var urlApi = "https://api.energyzero.nl/v1/energyprices?fromDate=2023-05-13T22%3A00%3A00.000Z&tillDate=2023-05-15T21%3A59%3A59.999Z&interval=4&usageType=1&inclBtw=true";
		var urlApi = "https://api.energyzero.nl/v1/energyprices?"
		var endingApi = "&interval=4&usageType=1&inclBtw=true" 
		var retry = true;

		const today = new Date();
		today.setHours(0,0,0,0);
		let tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);
		urlApi = urlApi + "fromDate=" + today.toJSON()
		urlApi = urlApi + "&tillDate=" + tomorrow.toJSON()
		urlApi = urlApi + endingApi
		var dataRequest = new XMLHttpRequest();
		dataRequest.open("GET", urlApi, true);
		console.log ('requested');
		dataRequest.onreadystatechange = function() {
			console.log(this.readyState);
			if (this.readyState === 4) {
				console.log(this.status);
				Log.log (self.name, "Working");
				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
					Log.log (self.name, "200");
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load data.");
				}
				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		dataRequest.send();
	},


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");
		// If this.dataRequest is not empty
		if (this.dataRequest) {
			console.log('updating...');
			var wrapperDataRequest = document.createElement("div");
			// check format https://jsonplaceholder.typicode.com/posts/1
			console.log (this.dataRequest.Prices);

			var labelDataRequest = document.createElement("label");
			// Use translate function
			//             this id defined in translations files
			labelDataRequest.innerHTML = this.translate("Energy price chart");


			wrapper.appendChild(labelDataRequest);
			wrapper.appendChild(wrapperDataRequest);
//		}


// it was me
		console.log ('recharting...');
		wrapper.appendChild(this.renderGraph());
		}
//That's it


		// Data from helper
		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			// translations  + datanotification
			wrapperDataNotification.innerHTML =  this.dataRequest.Prices[0].readingDate;

			wrapper.appendChild(wrapperDataNotification);
		}
		return wrapper;
	},

	getScripts: function() {
		return [];
	},

	getStyles: function () {
		return [
			"energy.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	renderGraph: function () {
//		console.log ('Started rendering...');
    		var i;
    		var width = this.config.graphWidth;
    		var height = this.config.graphHeight;
    		var element = document.createElement('canvas');
    		element.className = "energy-graph";
    		element.width  = width;
    		element.height = height;
    		var context = element.getContext('2d');

    		var smallStep = Math.floor(width/24);
    		context.save();
    		context.strokeStyle = 'gray';
    		context.lineWidth = 2;
    		for (i = 1; i < 24; i++) {
      			context.moveTo(i * smallStep, height);
      			context.lineTo(i * smallStep, height - 10);
      			context.stroke();
    			}
    		context.restore();

    		var largeStep = Math.floor(width/2);
    		context.save();
    		context.strokeStyle = 'gray';
    		context.setLineDash([5, 15]);
    		context.lineWidth = 1;
    		for (i = 1; i < 2; i++) {
      			context.moveTo(0, i * largeStep);
      			context.lineTo(width, i * largeStep);
      			context.stroke();
    			}
    		context.restore();

    		var data = this.dataRequest.Prices;
    		var stepSize = Math.round(width / data.length);
    		context.save();
    		context.strokeStyle = 'white';
    		context.fillStyle = 'white';
    		context.globalCompositeOperation = 'xor';
//    		context.beginPath();
//    		context.moveTo(0, height);
    		var threshold = 0.01;
		//replace with this.config.precipitationProbabilityThreshold;
    		var price;
		var maxPrice = 0.2;
    		// figure out how we're going to scale our graph
  

  		for (i = 0; i < data.length; i++) {
      			maxPrice = Math.max(maxPrice, data[i].price);
    			}


    		// if current intensity is above our normal scale top, make that the top
    		//if (maxIntensity < 0.2) {
		//replace with this.config.precipitationIntensityScaleTop) {
      		//	maxIntensity = this.config.priceTop;
    		//	}
		var startHour = new Date();
		startHour.setMinutes(0,0,0);
    		for (i = 0; i < data.length; i++) {
        			price = height * (data[i].price / maxPrice);
				if (new Date(data[i].readingDate).getHours() === startHour.getHours()) { 
					console.log ("Gotcha !");
					context.strokeStyle="green"; context.strokeRect(i*stepSize, height, stepSize, height);
					}
      				//context.lineTo(i * stepSize, height - price);
				context.fillRect(i*stepSize,height,stepSize,-price);
    				}
    		context.lineTo(width, height);
    		context.closePath();
    		context.fill();
    		context.restore();
		console.log (data[0].readingDate);

    		return element;
  		},


	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("energy-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "energy-NOTIFICATION_TEST") {
			// set dataNotification
			this.dataNotification = payload;
			this.updateDom();
		}
	},
});
