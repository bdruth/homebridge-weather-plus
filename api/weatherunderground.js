/*jshint esversion: 6,node: true,-W041: false */
"use strict";

const Wunderground = require('weather-underground-node'),
    converter = require('../util/converter'),
    moment = require('moment-timezone');
class WundergroundAPI {
    constructor(apiKey, location, l, d) {
        this.attribution = 'Powered by Weather Underground';
        this.reportCharacteristics = [
            'AirPressure',
            'Condition',
            'ConditionCategory',
            'Humidity',
            'ObservationStation',
            'ObservationTime',
            'Rain1h',
            'RainDay',
            'SolarRadiation',
            'Temperature',
            'UVIndex',
            'Visibility',
            'WindDirection',
            'WindSpeed',
            'WindSpeedMax'
        ];
        this.forecastCharacteristics = [
            'Condition',
            'ConditionCategory',
            'ForecastDay',
            'Humidity',
            'RainChance',
            'RainDay',
            'Temperature',
            'TemperatureMin',
            'WindDirection',
            'WindSpeed',
            'WindSpeedMax'
        ];
        this.forecastDays = 4;
        this.location = location;
        this.log = l;
        this.debug = d;

        this.wunderground = new Wunderground(apiKey);

    }

    update(callback) {
        this.debug("Updating weather with weather underground");

        let weather = {};
        weather.forecasts = [];

        this.wunderground.ForecastDaily().FiveDay().ByPostalCode(this.location, 'US').Language("en-US").request(function (error, response) {
            if (!error) {
                // Current weather report
                var lookAt
                try {
                    lookAt = 'current_observation'
                    // weather.report = this.parseReport(response.current_observation);

                    // Forecasts for today and next 3 days
                    lookAt = 'forecastday[0]'
                    weather.forecasts.push(this.parseForecast(response,0));
                    // lookAt = 'forecastday[1]'
                    // weather.forecasts.push(this.parseForecast(response));
                    // lookAt = 'forecastday[2]'
                    // weather.forecasts.push(this.parseForecast(response));
                    // lookAt = 'forecastday[3]'
                    // weather.forecasts.push(this.parseForecast(response));
                    callback(null, weather);
                }
                catch(error) {
                    this.log.error("Error parsing weather report (%s) for Weather Underground", lookAt);
                    this.log.error("Error Message: " + error);
                    callback(error);
                }
            }
            else {
                this.log.error("Error retrieving weather report and forecast for Weather Underground");
                this.log.error("Error Message: " + error);
                callback(error);
            }
        }.bind(this));
    }

    parseReport(values) {
        let report = {};

        try {
            report.AirPressure = parseInt(values.pressure_mb);
            report.Condition = values.weather;
            report.ConditionCategory = converter.getConditionCategory(values.icon);
            report.Humidity = parseInt(values.relative_humidity.substr(0, values.relative_humidity.length - 1));
            report.ObservationStation = values.observation_location.full;
            report.ObservationTime = values.observation_time_rfc822.split(' ')[4];
            report.Rain1h = isNaN(parseInt(values.precip_1hr_metric)) ? 0 : parseInt(values.precip_1hr_metric);
            report.RainDay = isNaN(parseInt(values.precip_today_metric)) ? 0 : parseInt(values.precip_today_metric);
            report.SolarRadiation = isNaN(parseInt(values.solarradiation)) ? 0 : parseInt(values.solarradiation);
            report.Temperature = values.temp_c;
            report.UVIndex = isNaN(parseInt(values.UV)) ? 0 : parseInt(values.UV);
            report.Visibility = isNaN(parseInt(values.visibility_km)) ? 0 : parseInt(values.visibility_km);
            report.WindDirection = values.wind_dir;
            report.WindSpeed = parseFloat(values.wind_kph);
            report.WindSpeedMax = parseFloat(values.wind_gust_kph);
        }
        catch(error) {
            this.log.error("Error retrieving weather report for Weather Underground");
            this.log.error("Error Message: " + error);
        }

        return report;
    }

    parseForecast(values,index) {
        let forecast = {};
        let dayIndex = index + 1;

        try {
            // forecast.Condition = values.conditions;
            // forecast.ConditionCategory = converter.getConditionCategory(values.icon);
            forecast.ForecastDay = values.dayOfWeek[dayIndex];
            forecast.Humidity = values.dayPart[0].relativeHumidity[dayIndex];
            forecast.RainChance = values.dayPart[0].precipChance[dayIndex];
            forecast.RainDay = values.dayPart[0].qpf[dayIndex]
            forecast.Temperature = values.temperatureMax[dayIndex];
            forecast.TemperatureMin = values.temperatureMax[dayIndex];
            forecast.WindDirection = values.dayPart[0].windDirectionCardinal[dayIndex];
            forecast.WindSpeed = values.dayPart[0].windSpeed[dayIndex];
            // forecast.WindSpeedMax = parseFloat(values.maxwind.kph);
        }
        catch(error) {
            this.log.error("Error retrieving weather forecast for Weather Underground");
            this.log.error("Error Message: " + error);
        }

        return forecast;
    }
}

module.exports = {
    WundergroundAPI: WundergroundAPI
};
