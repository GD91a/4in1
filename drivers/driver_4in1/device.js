'use strict';

const { ZigBeeDevice} = require('homey-zigbeedriver');
const { Cluster} = require('zigbee-clusters');
const { CLUSTER } = require('zigbee-clusters');
const { debug} = require('zigbee-clusters');
const TuyaSpecificCluster = require('../../lib/TuyaSpecificCluster');
const TuyaSpecificClusterDevice = require('../../lib/TuyaSpecificClusterDevice');
const {getDataValue} = require("./helpers");



/*
      "description":    "TUYA TS0202 Motion Sensor with Button",
      "modelNames":     ["_TZ3210_cwamkvua"],
      Similar to     model: 'LKMSZ001',vendor: 'Linkoze',
*/
const dataPoints = {
  TUYA_DP_BOUTON: 101,
  TUYA_DP_BRIGHTNESS: 102};

const boutonMapping = new Map();
boutonMapping.set(0, 'singleClick');
boutonMapping.set(1, 'doubleClick');
boutonMapping.set(2, 'hold');

const brightnessMapping = new Map();
brightnessMapping.set(0, 'dark');
brightnessMapping.set(1, 'bright');


class driver_4in1 extends TuyaSpecificClusterDevice {
	async onNodeInit({ zclNode }) 
    {
    this.printNode();
    this.log('début ----------------------------------------------------------------------------');

    // Cluster tuya
    this.log('register button, brightness ------------------------------------------------------');

    zclNode.endpoints[1].clusters.tuya.on('response', (value) => this.processResponse(value));        // never this case
    zclNode.endpoints[1].clusters.tuya.on('reporting', (value) => this.processReporting(value));      // never this case
    zclNode.endpoints[1].clusters.tuya.on('datapoint', (value) => this.processDatapoint(value));      // never this case
    //Always this one :
    zclNode.endpoints[1].clusters.tuya.on('reportingConfiguration', (value) => this.processReportingConfiguration(value));
   

    // Cluster IAS
    this.log('--------------------IAS--------------------', zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME]);
    zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].onZoneStatusChangeNotification = payload =>
    {this.onIASZoneStatusChangeNotification(payload);}
    // IAS enroll request
    zclNode.endpoints[1].clusters.iasZone.onZoneEnrollRequest = () => 
    { zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse
        ({enrollResponseCode: 0, // Success
          zoneId: 10,});}; // Choose a zone id
    
    this.log('lappareil est démarré');
    }

  onDeleted() { this.log('driver_4in1 removed'); }



  //===================================================================================================================================

  onIASZoneStatusChangeNotification({zoneStatus, extendedStatus, zoneId, delay,}) {
		this.log('IASZoneStatusChangeNotification received:', 'zoneStatus : ',zoneStatus, 'extendedStatus : ',extendedStatus, 'zoneID : ',zoneId, 'delay : ',delay);
		this.log('Motion : ',zoneStatus.alarm1,' tamper : ',zoneStatus.tamper,' Battery : ',zoneStatus.battery);
    this.setCapabilityValue('alarm_motion', zoneStatus.alarm1).catch(this.error);
		this.setCapabilityValue('alarm_battery', zoneStatus.battery).catch(this.error);
	}

  async processReportingConfiguration(data) {
    this.log('########### ReportingConfiguration: ', data);
    const parsedValue = getDataValue(data);
    this.log('DP ', data.dp, ' with parsed value ', parsedValue);
    switch (data.dp) {

      case dataPoints.TUYA_DP_BOUTON:
        this.log('Bouton appuyé: ', boutonMapping.get(Number(parsedValue)), ' (', parsedValue, ')');
        const buttonPressed = this.homey.flow.getDeviceTriggerCard ('buttonPressed');
        this.log('buttonPressed : ',buttonPressed);

        this._buttonPressedTriggerDevice = this.homey.flow.getDeviceTriggerCard('buttonPressed')
        .registerRunListener(async (args, state) => { return (null, args.action === state.action); });

        var action = boutonMapping.get(Number(parsedValue));

        return this._buttonPressedTriggerDevice.trigger(this, {}, { action: `${action}` })
        .then(() => this.log(`Triggered button, action=${action}`))
        .catch(err => this.error('Error triggering button', err));
        break;

      case dataPoints.TUYA_DP_BRIGHTNESS: 
        this.log('Lum changée : ', brightnessMapping.get(Number(parsedValue)), ' (', parsedValue, ')');
        this.setCapabilityValue('alarm_lum', parsedValue).catch(this.error);

        this._lumTriggerDevice = this.homey.flow.getDeviceTriggerCard('alarm_lum')
        .registerRunListener(async (args, state) => {
          return (null, args.action === state.action);
        });

        var action = brightnessMapping.get(Number(parsedValue));

        return this._lumTriggerDevice.trigger(this, {}, { action: `${action}` })
        .then(() => this.log(`Triggered lum, action=${action}`))
        .catch(err => this.error('Error triggering lum', err));
        break;
  
      default:
        this.log('DP ', data.dp, ' not handled!');
    }
  }
// The following proc were never called ...

  async processResponse(data) {
    this.log('########### Response: ', data);
    const parsedValue = getDataValue(data);
    this.log('Parsed value ', parsedValue);
  }

  async processReporting(data) {
    this.log('########### Response: ', data);
    const parsedValue = getDataValue(data);
    this.log('Parsed value ', parsedValue);
  }

  async processDatapoint(data) {
    this.log('########### Response: ', data);
    const parsedValue = getDataValue(data);
    this.log('Parsed value ', parsedValue);
  }

}


module.exports = driver_4in1


/*


  [ "ids": {
  "modelId": "TS0202",
  "manufacturerName": "_TZ3210_cwamkvua"
  },
      "endpoints": {
      "ieeeAddress": "a4:c1:38:06:44:c8:16:f2",
      "networkAddress": 42984,
      "modelId": "TS0202",
      "manufacturerName": "_TZ3210_cwamkvua",
          "endpointDescriptors": [
            {
            "status": "SUCCESS",
            "nwkAddrOfInterest": 42984,
            "_reserved": 20,
            "endpointId": 1,
            "applicationProfileId": 260,
            "applicationDeviceId": 1026,
            "applicationDeviceVersion": 0,
            "_reserved1": 1,
                "inputClusters": [
                1,
                1280,
                61184,
                0
                ],
                "outputClusters": [
                25,
                10
                ]
            }
          ],
      "deviceType": "enddevice",
      "receiveWhenIdle": false,
      "capabilities": {
      "alternatePANCoordinator": false,
      "deviceType": false,
      "powerSourceMains": false,
      "receiveWhenIdle": false,
      "security": false,
      "allocateAddress": true
      },
"extendedEndpointDescriptors": {
"1": {
"clusters": {
"powerConfiguration": {
"attributes": [
{
"acl": [
"readable",
"reportable"
],
"id": 0,
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"reportable"
],
"id": 32,
"name": "batteryVoltage",
"value": 0,
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"reportable"
],
"id": 33,
"name": "batteryPercentageRemaining",
"value": 0,
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"reportable"
],
"id": 65533,
"name": "clusterRevision",
"value": 1,
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
}
]
},
"iasZone": {
"attributes": [
{
"acl": [
"readable",
"reportable"
],
"id": 0,
"name": "zoneState",
"value": "notEnrolled",
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"reportable"
],
"id": 1,
"name": "zoneType",
"value": "contactSwitch",
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"reportable"
],
"id": 2,
"name": "zoneStatus",
"value": {
"type": "Buffer",
"data": [
5,
0
]
},
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"writable",
"reportable"
],
"id": 16,
"name": "iasCIEAddress",
"value": "b4:35:22:ff:fe:8b:62:75",
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"reportable"
],
"id": 17,
"name": "zoneId",
"value": 255,
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
},
{
"acl": [
"readable",
"reportable"
],
"id": 65533,
"name": "clusterRevision",
"value": 1,
"reportingConfiguration": {
"status": "NOT_FOUND",
"direction": "reported"
}
}
]
},
"basic": {
"attributes": [
{
"acl": [
"readable",
"reportable"
],
"id": 0,
"name": "zclVersion",
"value": 3
},
{
"acl": [
"readable",
"reportable"
],
"id": 1,
"name": "appVersion",
"value": 101
},
{
"acl": [
"readable",
"reportable"
],
"id": 2,
"name": "stackVersion",
"value": 0
},
{
"acl": [
"readable",
"reportable"
],
"id": 3,
"name": "hwVersion",
"value": 1
},
{
"acl": [
"readable",
"reportable"
],
"id": 4,
"name": "manufacturerName",
"value": "_TZ3210_cwamkvua"
},
{
"acl": [
"readable",
"reportable"
],
"id": 5,
"name": "modelId",
"value": "TS0202"
},
{
"acl": [
"readable",
"reportable"
],
"id": 6,
"name": "dateCode",
"value": ""
},
{
"acl": [
"readable",
"reportable"
],
"id": 7,
"name": "powerSource",
"value": "battery"
},
{
"acl": [
"readable",
"writable",
"reportable"
],
"id": 65502
},
{
"acl": [
"readable",
"reportable"
],
"id": 65533,
"name": "clusterRevision",
"value": 2
},
{
"acl": [
"readable",
"reportable"
],
"id": 65534,
"name": "attributeReportingStatus",
"value": "PENDING"
},
{
"acl": [
"readable",
"reportable"
],
"id": 65506
},
{
"acl": [
"readable",
"reportable"
],
"id": 65507
}
]
}
},
"bindings": {
"ota": {},
"time": {
"attributes": [
{
"acl": [
"readable"
],
"id": 65533,
"name": "clusterRevision",
"value": 1
}
]
}
}
}
}
}]
*/