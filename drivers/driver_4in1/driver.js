const Homey = require('homey');

class Driver extends Homey.Driver {
  async onInit() {
   // this._deviceTurnedOn = this.homey.flow.getDeviceTriggerCard("buttonPressed");
  }
/*
  triggerMyFlow(device, tokens, state) {
    this._deviceTurnedOn
      .trigger(device, tokens, state)
      .then(this.log('==================================driver.js====trigger flow', device,'/',tokens,'/',state))
      .catch(this.error);
  } */
}

module.exports = Driver;
