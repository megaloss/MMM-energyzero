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
		graphHeight: 150,
		graphWidth: 300,
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

		var urlApi = "https://api.energyzero.nl/v1/energyprices?"
		var endingApi = "&interval=4&usageType=1&inclBtw=true" 
		var retry = true;

		const today = new Date();
		today.setHours(0,0,0,0);
		let tomorrow = new Date();
		tomorrow.setHours(0,0,0,0);
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
			labelDataRequest.innerHTML = this.translate("Electricity per kwh");


			wrapper.appendChild(labelDataRequest);
			wrapper.appendChild(wrapperDataRequest);


		console.log ('recharting...');
		wrapper.appendChild(this.renderGraph());
		}


		// Data from helper
		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			// translations  + datanotification
			//wrapperDataNotification.innerHTML =  this.dataRequest.Prices[0].readingDate;
			wrapperDataNotification.innerHTML = new Date().toLocaleTimeString();
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
		const startY = height / 2;
    		var smallStep = Math.floor(width/24);
    		context.save();
    		context.strokeStyle = 'gray';
    		context.lineWidth = 2;
    		for (i = 1; i < 24; i++) {
      			context.moveTo(i * smallStep, startY + 5);
      			context.lineTo(i * smallStep, startY - 5);
      			context.stroke();
    			}
//    		context.restore();
		smallStep = Math.floor (height/20)
                for (i = 1; i < 20; i++) {
                        context.moveTo(0, i * smallStep);
                        context.lineTo(5, i * smallStep);
                        context.stroke();
                        }
                context.restore();
    		var data = this.dataRequest.Prices;
    		var stepSize = Math.round(width / data.length);
    		context.save();
    		context.strokeStyle = 'white';
    		context.fillStyle = 'white';
    		context.globalCompositeOperation = 'xor';

    		var threshold = 0.01;
    		var price;
		var curPrice=0;
		var maxPrice = 0.2;
  

  		for (i = 0; i < data.length; i++) {
      			maxPrice = Math.max(maxPrice, data[i].price);
    			}


		var startHour = new Date();
		startHour.setMinutes(0,0,0);
    		for (i = 0; i < data.length; i++) {
        			price = startY * (data[i].price / maxPrice);
				if (new Date(data[i].readingDate).getHours() === startHour.getHours()) { 
					context.lineWidth = 3;
					context.strokeStyle="lime"; 
					context.strokeRect(i*stepSize, 0, stepSize, height);
					context.font = "20px serif";
					curPrice = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data[i].price);
					}
				context.fillRect(i*stepSize,startY,stepSize,-price);
    				}
		context.fillStyle = 'lime';
    		context.fillText(curPrice,width/2-40,height);
		context.fillStyle = 'white';
		context.font = "14px serif";
                context.fillText(maxPrice.toLocaleString(undefined, {minimumFractionDigits : 2}),10,10);
		context.font = "14px serif";
                context.fillText("0.00",10,startY+16);
		context.fill();
    		context.restore();

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
