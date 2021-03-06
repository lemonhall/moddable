/*
 * Copyright (c) 2016-2017  Moddable Tech, Inc.
 *
 *   This file is part of the Moddable SDK.
 * 
 *   This work is licensed under the
 *       Creative Commons Attribution 4.0 International License.
 *   To view a copy of this license, visit
 *       <http://creativecommons.org/licenses/by/4.0>.
 *   or send a letter to Creative Commons, PO Box 1866,
 *   Mountain View, CA 94042, USA.
 *
 */

import {} from "piu/MC";

const GRAPH_INTERVAL = 2000;	// Changes how frequently a bar is added to the graph
const MAX_RATE = 210;			// Max heart rate value
const MIN_RATE = 40;			// Min heart rate value

/* Skins and styles */
const GRAPH_COLORS = ["#0000FF", "#00FFFF", "#00FF00"];
const TEXT_COLOR = "#FFFFFF";
const BACKGROUND_COLOR = "#000000";

const digitsTexture = new Texture("digits.png");

/* UI templates */
const GraphLine = Port.template($ => ({
	bottom: 0, height: $.barHeight, left: 0, width:16,
	Behavior: class extends Behavior {
		onCreate(port) {
			this.data = {remainder: $.remainder, fullBars: $.fullBars};
			this.state = 0;
			port.interval = 650;
			port.start();
		}
		onDraw(port) {
			if (this.state == 1) {
				port.fillColor(BACKGROUND_COLOR, 0, 0, port.width, port.height);
				this.state = 0;
			} else {
				let data = this.data;
				let colorIndex = 0;
				let y = port.height - 10;
				for ( let i = 0; i < data.fullBars; i++ ) {
					port.fillColor(GRAPH_COLORS[colorIndex], 1, y, 14, 10);
					y -= 12;
					if ((i == 0) || (i == 2)) colorIndex++
				}
				port.fillColor(GRAPH_COLORS[colorIndex], 1, 0, 14, data.remainder);
				if (this.state == 0) this.state = 1;
			}
		}
		onTimeChanged(port) {
			port.interval = (port.interval == 650)? 250: 650;
			port.invalidate();
		}
		onStopFlickering(port) {
			port.stop();
			this.state = 2;
			port.invalidate();
		}
	}
}));

const GraphContainer = Row.template($ => ({
	bottom:0, height: 64, left: 0, right:0,
	Behavior: class extends Behavior {
		onCreate(content) {
			content.interval = GRAPH_INTERVAL;
			content.time = 0;
			content.start();
			for (let i = 0; i < 11; i++) {
				let dummyLine = new GraphLine({barHeight: 2, fullBars: 0, remainder: 2});
				content.add(dummyLine);
				dummyLine.delegate("onStopFlickering");
			}
		}
		onTimeChanged(content) {
			let rate = application.first.delegate("getRate");
			let barHeight = Math.round((rate-MIN_RATE)/(MAX_RATE-MIN_RATE)*content.height);
			let fullBars = Math.floor(barHeight / 12);
			let remainder = barHeight % 12;
			content.remove(content.first)
			content.last.delegate("onStopFlickering")
			content.add(new GraphLine({barHeight, fullBars, remainder}))
			application.purge();
		}
	}
}))

const DigitContainer = Port.template($ => ({
	top:0, width:128, height:112,
	Behavior: class extends Behavior {
		onChangeRate(port, rate) {
			this.rate = rate;
			port.invalidate();
		}
		onDraw(port) {
			let y = 24;
			if (this.rate > 99) {
				port.drawTexture(digitsTexture, TEXT_COLOR, 16, y, Math.floor(this.rate / 100) * 32, 0, 32, 48);
				port.drawTexture(digitsTexture, TEXT_COLOR, 48, y, Math.floor((this.rate % 100) / 10) * 32, 0, 32, 48);
				port.drawTexture(digitsTexture, TEXT_COLOR, 80, y, Math.floor((this.rate % 100) % 10) * 32, 0, 32, 48);
			} else {
				port.drawTexture(digitsTexture, TEXT_COLOR, 32, y, Math.floor(this.rate / 10) * 32, 0, 32, 48);
				port.drawTexture(digitsTexture, TEXT_COLOR, 64, y, Math.floor(this.rate % 10) * 32, 0, 32, 48);
			}
			port.drawTexture(digitsTexture, TEXT_COLOR, 51, y+50, 0, 54, 25, 12,)
		}
		getRate() {
			return this.rate;
		}
	}
}))

/* Application set-up */
export default new Application(null, { 
	commandListLength:4096, displayListLength:4096, touchCount:0, skin: new Skin({ fill: BACKGROUND_COLOR }),
	contents: [
		new DigitContainer,
		new GraphContainer
	],
	Behavior: class extends Behavior {
		onCreate(application) {
			application.interval = 2000;
			application.start();
		}
		onTimeChanged(application) {
			 let randomHeartRate = Math.floor(Math.random() * (MAX_RATE - MIN_RATE + 1)) + MIN_RATE;
			 application.first.delegate("onChangeRate", randomHeartRate);
		}
	}
});
