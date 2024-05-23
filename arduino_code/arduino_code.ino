#include <lmic.h>
#include "hal/hal.h"
#include <SPI.h>
#include <WiFiMulti.h>
#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "DHT.h"
#include <MQUnifiedsensor.h>
#include "DFRobot_EC.h"
#include "DFRobot_ESP_EC.h"
#include "DFRobot_ESP_PH.h"
#include <EEPROM.h>
//
// For normal use, we require that you edit the sketch to replace FILLMEIN
// with values assigned by the TTN console. However, for regression tests,
// we want to be able to compile these scripts. The regression tests define
// COMPILE_REGRESSION_TEST, and in that case we define FILLMEIN to a non-
// working but innocuous value.
//
#ifdef COMPILE_REGRESSION_TEST
# define FILLMEIN 0
#else
# warning "You must replace the values marked FILLMEIN with real values from the TTN control panel!"
# define FILLMEIN (#dont edit this, edit the lines that use FILLMEIN)
#endif





// This EUI must be in little-endian format, so least-significant-byte
// first. When copying an EUI from ttnctl output, this means to reverse
// the bytes. For TTN issued EUIs the last bytes should be 0xD5, 0xB3,
// 0x70.
static const u1_t PROGMEM APPEUI[8]={0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
void os_getArtEui (u1_t* buf) { memcpy_P(buf, APPEUI, 8);}

// This should also be in little endian format, see above.
static const u1_t PROGMEM DEVEUI[8]={0xAD, 0x56, 0x06, 0xD0, 0x7E, 0xD5, 0xB3, 0x70};
void os_getDevEui (u1_t* buf) { memcpy_P(buf, DEVEUI, 8);}

// This key should be in big endian format (or, since it is not really a
// number but a block of memory, endianness does not really apply). In
// practice, a key taken from ttnctl can be copied as-is.
static const u1_t PROGMEM APPKEY[16] = {0x7F, 0x2B, 0x7E, 0xF8, 0x17, 0x28, 0x07, 0x49, 0xC3, 0x44, 0x52, 0x44, 0x58, 0xB8, 0xB5, 0x50};
void os_getDevKey (u1_t* buf) {  memcpy_P(buf, APPKEY, 16);}

static uint8_t mydata[] = "Hello, world!";

static uint8_t buff[50];

static osjob_t sendjob;

// Schedule TX every this many seconds (might become longer due to duty
// cycle limitations).
const unsigned TX_INTERVAL = 60;

// Pin mapping
const lmic_pinmap lmic_pins = {
    .nss = 5,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 14,
    .dio = {27, 26, 25},
};




#define LIGHT_PIN 35 /*12*/
#define WATER_TEMP_PIN 4
#define DHTPIN 33
#define PH_PIN 37  // No pin
#define TDS_PIN 32
#define ph_offset 0.00
#define EC_PIN 34 
#define CO2_PIN 34 /*2*/


//Water temperature sensor setup
OneWire oneWire(WATER_TEMP_PIN);
DallasTemperature water_temperature_sensor(&oneWire);

//DHT sensor type
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

//ph sensor setup
#define ESPADC 4096.0   //the esp Analog Digital Convertion value
#define ESPVOLTAGE 3300 //the esp voltage supply value
DFRobot_ESP_PH ph;

//ec sensor setup
DFRobot_ESP_EC ec;



/******************************************/


float get_humidity(){
  float h = dht.readHumidity();
  if(isnan(h)){
    Serial.println("DHT falied for Humidity!");
    return 0;
  }
  return h;  
}

float get_temperature(){
  float t = dht.readTemperature();
   if(isnan(t)){
    Serial.println("DHT Failed for Temperature!");
    return 0;
   }
   return t;
}

float get_luminosity(){
  uint16_t val = analogRead(LIGHT_PIN);  // read the input pin (12 bit)
//   Serial.println(val);
   return map(val,0,4095,0,6000);
}

float get_water_temperature(){
  water_temperature_sensor.requestTemperatures();
  return water_temperature_sensor.getTempCByIndex(0);
}

float get_tds(){                                  //Need to check...05/03
  int sensorValue = analogRead(TDS_PIN);
  if(sensorValue==0) return 0;
  float Voltage  = sensorValue*5/1024.0;
  float tdsValue =(133.42/(Voltage*Voltage*Voltage) - 255.86*Voltage*Voltage + 857.39*Voltage)*0.5;
  Serial.println(tdsValue);
  if(tdsValue<0) return 0.00;
  return tdsValue;  
}



float get_electrical_conductivity(){
  float voltage=analogRead(EC_PIN)/1024.0*5000; 
  float temperature=get_water_temperature();
  float ecValue =  ec.readEC(voltage,temperature);
  ec.calibration(voltage,temperature);
  Serial.println(ecValue);
  return ecValue;
}


void printHex2(unsigned v) {
    v &= 0xff;
    if (v < 16)
        Serial.print('0');
    Serial.print(v, HEX);
}



#define N_SENSOR 6
#define T 3
int counter=T;
bool beg = true;

float ref[N_SENSOR] = {0.1,0.1,0.1,0.1,0.1,0.1};

void get_payload2(float floatValues[], int numValues){
//  float floatValues[] = {-123.456, 456.789, 789.123};
//     int numValues = sizeof(floatValues) / sizeof(float); // Number of float values

// Calculate the total size needed for the payload
  int payloadSize = numValues * sizeof(float)+1;
  for(int i=0;i<numValues;i++){
    ref[i] = floatValues[i];
  }
  Serial.println(numValues);
// Create a byte array to hold the packed data
  uint8_t payload[payloadSize];

// Serialize each float value into bytes and concatenate them
  buff[0]=2;
  int byteIndex = 1;
  for (int i = 0; i < numValues; i++) {
      memcpy(buff + byteIndex, &floatValues[i], sizeof(float));
      byteIndex += sizeof(float);
  }

    for (int i = 0; i < sizeof(payload); i++) {
      Serial.print(buff[i], HEX); // Print each byte in hexadecimal format
      Serial.print(" "); // Add a space for readability
  }

//  t2_packs++;
}

void get_payload1(int integers[], int numValues){
  
//  int numValues = sizeof(integers);

// Calculate the total size needed for the payload
    int payloadSize = numValues + 1; // 1 additional byte for the '1'
    
    // Create a byte array to hold the packed data
//    uint8_t payload[payloadSize];
    
    // Set the first byte to '1'
    buff[0] = 1;
    
    // Copy the integers into the payload byte array starting from the second byte
    memcpy(buff + 1, integers, numValues);
    for (int i = 0; i < payloadSize; i++) {
      Serial.print(buff[i], HEX); // Print each byte in hexadecimal format
      Serial.print(" "); // Add a space for readability
  }
//    t1_packs++;

}

void get_payload3(float floatValues[], int integers[], int numValues){
//     int numValues = sizeof(floatValues) / sizeof(float); // Number of float values

// Calculate the total size needed for the payload
      int payloadSize = numValues * sizeof(float)+1+numValues;
    
    // Create a byte array to hold the packed data
//      uint8_t payload[payloadSize];
    
    // Serialize each float value into bytes and concatenate them
      buff[0]=3;
      int byteIndex = 1;
      for (int i = 0; i < numValues; i++) {
          memcpy(buff + byteIndex, &floatValues[i], sizeof(float));
          byteIndex += sizeof(float);
      }
      memcpy(buff+byteIndex, integers, numValues);
        for (int i = 0; i < sizeof(buff); i++) {
          Serial.print(buff[i], HEX); // Print each byte in hexadecimal format
          Serial.print(" "); // Add a space for readability
      }
}

void get_payload4(unsigned long tt){
  buff[0]=4;
    
   memcpy(buff+1, &tt, sizeof(unsigned long));
        for (int i = 0; i < sizeof(buff); i++) {
          Serial.print(buff[i], HEX); // Print each byte in hexadecimal format
          Serial.println(" "); // Add a space for readability
      }
}



int get_payload(float vals[]){
  int changes[N_SENSOR];
  int type=1;
  int TH=100;
  if(beg){
    get_payload2(vals, N_SENSOR);
    counter=1;
    beg = false;
    return(4*N_SENSOR+1);
  }
  for(int i=0;i<N_SENSOR;i++){
    int diff;
    if(ref[i]==0){
      if(vals[i]!=0){
        type = 2;
        break;
      }
      diff = (int)(vals[i]-ref[i]);
    }
    else{
      diff = (int)(((vals[i]-ref[i])/ref[i])*100);
    }
    changes[i]=diff;
    if(abs(diff)>TH){
      type=2;
      break;
    }
  }
  if(counter==T){
    get_payload3(vals, changes, N_SENSOR);
    counter = 1;
    return (5*N_SENSOR+1);
  }
  else if(type==1){
    get_payload1(changes,N_SENSOR);
    counter++;
    return (N_SENSOR+1);
  }
  else if(type==2){
    get_payload2(vals, N_SENSOR);
    counter=1;
    return (4*N_SENSOR+1);
  }
  

//  return type;
}

void send_via_ttn(float vals[], osjob_t* j){
    
     int payloadSize = get_payload(vals);
         // Check if there is not a current TX/RX job running
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND, not sending"));
    } else {
        // Prepare upstream data transmission at the next possible time.
//        float floatValue = 123.456;
//    uint8_t bytes[sizeof(float)];
//    memcpy(bytes, &floatValue, sizeof(float));
//    for (int i = 0; i < sizeof(float); i++) {
//      Serial.print(bytes[i], HEX); // Print each byte in hexadecimal format
//      Serial.print(" "); // Add a space for readability
//  }
        LMIC_setTxData2(1, mydata, sizeof(mydata)-1, 0);
        Serial.println(F("Packet queued"));
    }
    // Next TX is scheduled after TX_COMPLETE event.
}


void onEvent (ev_t ev) {
    Serial.print(os_getTime());
    Serial.print(": ");
    switch(ev) {
        case EV_SCAN_TIMEOUT:
            Serial.println(F("EV_SCAN_TIMEOUT"));
            break;
        case EV_BEACON_FOUND:
            Serial.println(F("EV_BEACON_FOUND"));
            break;
        case EV_BEACON_MISSED:
            Serial.println(F("EV_BEACON_MISSED"));
            break;
        case EV_BEACON_TRACKED:
            Serial.println(F("EV_BEACON_TRACKED"));
            break;
        case EV_JOINING:
            Serial.println(F("EV_JOINING"));
            break;
        case EV_JOINED:
            Serial.println(F("EV_JOINED"));
            {
              u4_t netid = 0;
              devaddr_t devaddr = 0;
              u1_t nwkKey[16];
              u1_t artKey[16];
              LMIC_getSessionKeys(&netid, &devaddr, nwkKey, artKey);
              Serial.print("netid: ");
              Serial.println(netid, DEC);
              Serial.print("devaddr: ");
              Serial.println(devaddr, HEX);
              Serial.print("AppSKey: ");
              for (size_t i=0; i<sizeof(artKey); ++i) {
                if (i != 0)
                  Serial.print("-");
                printHex2(artKey[i]);
              }
              Serial.println("");
              Serial.print("NwkSKey: ");
              for (size_t i=0; i<sizeof(nwkKey); ++i) {
                      if (i != 0)
                              Serial.print("-");
                      printHex2(nwkKey[i]);
              }
              Serial.println();
            }
            // Disable link check validation (automatically enabled
            // during join, but because slow data rates change max TX
      // size, we don't use it in this example.
            LMIC_setLinkCheckMode(0);
            break;
        /*
        || This event is defined but not used in the code. No
        || point in wasting codespace on it.
        ||
        || case EV_RFU1:
        ||     Serial.println(F("EV_RFU1"));
        ||     break;
        */
        case EV_JOIN_FAILED:
            Serial.println(F("EV_JOIN_FAILED"));
            break;
        case EV_REJOIN_FAILED:
            Serial.println(F("EV_REJOIN_FAILED"));
            break;
        case EV_TXCOMPLETE:
            Serial.println(F("EV_TXCOMPLETE (includes waiting for RX windows)"));
            if (LMIC.txrxFlags & TXRX_ACK)
              Serial.println(F("Received ack"));
            if (LMIC.dataLen) {
              Serial.print(F("Received "));
              Serial.print(LMIC.dataLen);
              Serial.println(F(" bytes of payload"));
            }
            // Schedule next transmission
            os_setTimedCallback(&sendjob, os_getTime()+sec2osticks(TX_INTERVAL), do_send);
            break;
        case EV_LOST_TSYNC:
            Serial.println(F("EV_LOST_TSYNC"));
            break;
        case EV_RESET:
            Serial.println(F("EV_RESET"));
            break;
        case EV_RXCOMPLETE:
            // data received in ping slot
            Serial.println(F("EV_RXCOMPLETE"));
            break;
        case EV_LINK_DEAD:
            Serial.println(F("EV_LINK_DEAD"));
            break;
        case EV_LINK_ALIVE:
            Serial.println(F("EV_LINK_ALIVE"));
            break;
        /*
        || This event is defined but not used in the code. No
        || point in wasting codespace on it.
        ||
        || case EV_SCAN_FOUND:
        ||    Serial.println(F("EV_SCAN_FOUND"));
        ||    break;
        */
        case EV_TXSTART:
            Serial.println(F("EV_TXSTART"));
            break;
        case EV_TXCANCELED:
            Serial.println(F("EV_TXCANCELED"));
            break;
        case EV_RXSTART:
            /* do not print anything -- it wrecks timing */
            break;
        case EV_JOIN_TXCOMPLETE:
            Serial.println(F("EV_JOIN_TXCOMPLETE: no JoinAccept"));
            break;

        default:
            Serial.print(F("Unknown event: "));
            Serial.println((unsigned) ev);
            break;
    }
}

void do_send(osjob_t* j){
    // Check if there is not a current TX/RX job running
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND, not sending"));
    } else {
        // Prepare upstream data transmission at the next possible time.

        float vals[N_SENSOR];
        vals[0]=get_temperature();
        vals[1]=get_humidity();
        vals[2]=get_water_temperature();
        vals[3] = get_luminosity();
        vals[4]=get_tds();
        vals[5] = get_electrical_conductivity();
//        Serial.println(vals[2]);
        int payloadSize = get_payload(vals);
//        get_payload2(vals, N_SENSOR);
//        LMIC_setTxData2(1, mydata, sizeof(mydata)-1, 0);
        LMIC_setTxData2(1, buff, payloadSize, 0);

        Serial.println(F("Packet queued"));
    }
    // Next TX is scheduled after TX_COMPLETE event.
}

void setup() {
    Serial.begin(9600);
    Serial.println(F("Starting"));

    #ifdef VCC_ENABLE
    // For Pinoccio Scout boards
    pinMode(VCC_ENABLE, OUTPUT);
    digitalWrite(VCC_ENABLE, HIGH);
    delay(1000);
    #endif

    // LMIC init
    os_init();
    // Reset the MAC state. Session and pending data transfers will be discarded.
    LMIC_reset();

    // Start job (sending automatically starts OTAA too)
    do_send(&sendjob);
}

void loop() {
    os_runloop_once();
}


//Need to write update logic....
