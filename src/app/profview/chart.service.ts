import { Injectable, EventEmitter, Output } from '@angular/core';
import { BgcProfileData, CoreProfileData, StationParameters, ColorScaleSelection, DataArrays } from './profiles'
import * as moment from 'moment';

import { HEX_COLOR_MAPS } from './colormap.parameters'

export interface TraceParam {
    short_name: string
    long_name: string
    units: string
    long_units: string
    title: string
    cmapName: string
    color: string
    wavelength?: string
  }
@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() { }

  public statParams: StationParameters[]
  public colorscaleSelections: ColorScaleSelection[] = this.makeColorScaleSelections()
  
  public makeLayout(yLabel: string) {
    const layout = {
      height: 175, 
      width: 750,
      margin: {
        l: 5,
        r: 5,
        b: 25,
        t: 25,
        pad: 5
      },
      yaxis: {
          showticklabels: true,
          autorange: 'reversed', //scattergl currently does not show tick labels when axis is reversed
          type: "linear", 
          title: yLabel,
          automargin: true,
      },
      xaxis: {
          autorange: true, 
          type: "date", 
          title: "Date",
          automargin: true,
      }, 
      hovermode: "closest", 
      showlegend: true,
    }
    return layout
  }

  public make_line_layout(xLabel: string, yLabel: string) {
    const layout = {
      height:300, 
      width: 300,
      margin: {
        l: 5,
        r: 5,
        b: 25,
        t: 25,
        pad: 5
      },
      yaxis: {
          showticklabels: true,
          autorange: 'reversed', //scattergl currently does not show tick labels when axis is reversed
          type: "linear", 
          title: yLabel,
          automargin: true,
      },
      xaxis: {
          autorange: true, 
          title: xLabel,
          automargin: true,
      }, 
      hovermode: "closest", 
      showlegend: true,
    }
    return layout
  }

  makeColorChartText(pres: number, date: string, text: string, value: number, units: string, cycle: number, qc?: number): string {
    let box = "<br>" + text + value.toString() + " " + units
    + "<br>date: " + date.toString()
    + "<br>pressure: " + pres.toString() + " dbar"
    + "<br>cycle: " + cycle.toString()
    if (qc) { box += "<br>qc: " + qc }
    box += "<br>click to see profile page"
    return(box)
  }

  make_hovor_chart_text(_id: string, lat: number, lon: number, date: string, cycle: number, qc: number): string {
    let box = "<br>profile id: " + _id
    + "<br>latitude: " + lat.toFixed(3) 
    + "<br>longitude: " + lon.toFixed(3)
    + "<br>date: " + lon.toFixed(3)
    + "<br>cycle: " + cycle
    + "<br>position qc: " + qc
    return box
  }
  
  makeLineChartText(xvalue: number, yvalue: number, time: string, xtext: string, ytext: string,
                   xunits: string, yunits: string, cycle: number,
                   xqc?: number, yqc?: number): string {
    let box = 
    "<br>" + xtext + xvalue.toString() + " " + xunits
    + "<br>" + ytext + yvalue.toString() + " " + yunits
    + "<br>date: " + time
    + "<br>cycle: " + cycle.toString()
    if (xqc) { box += "<br>" + xtext + " qc: " + xqc }
    if (yqc) { box += "<br>" + ytext + " qc: " + yqc }
    box += "<br>click to see profile page"
    return(box)
  }

  makeColorScaleSelections(): ColorScaleSelection[] {
    const cmapNames = Object.keys(HEX_COLOR_MAPS)
    let colorScaleSelections = []
    cmapNames.forEach( (cmapName: string) => {
      colorScaleSelections.push({value: cmapName, viewValue: cmapName})
    })
    return colorScaleSelections
  }
  

  collateProfileMeasurements = function(profileData: BgcProfileData[] | CoreProfileData[], yLabel: string, xLabel: string, includeQC?: boolean) { 
    let collatedProfiles = {};
    const num_measurements = profileData.length;
    collatedProfiles[yLabel] = new Array(num_measurements)
    collatedProfiles[xLabel] = new Array(num_measurements)
    const xQCLabel = xLabel + '_qc'
    const yQCLabel = yLabel + '_qc'
    if (includeQC) { collatedProfiles[xQCLabel] = new Array(num_measurements)
                     collatedProfiles[yQCLabel] = new Array(num_measurements) }
    for (var i = 0; i < num_measurements; ++i) {
        collatedProfiles[yLabel][i] = profileData[i][yLabel]
        collatedProfiles[xLabel][i] = profileData[i][xLabel]
        if (includeQC) {
          collatedProfiles[yQCLabel][i] = profileData[i][yQCLabel]
          collatedProfiles[xQCLabel][i] = profileData[i][xQCLabel]
        }
    }
    return collatedProfiles;
  }

  reduceGPSMeasurements = function(profileData: BgcProfileData | CoreProfileData, maxLength: number, measField: string) {
    if (profileData.POSITIONING_SYSTEM === 'GPS') {
      const mLen = profileData[measField].length
      if (mLen > maxLength) {
        //reduce array length to so that only every delta element is plotted
        const delta = Math.floor( mLen / maxLength )
        let reducedMeasurements = []
        for (let jdx = 0; jdx < mLen; jdx+=delta) {
          reducedMeasurements.push(profileData[measField][jdx])
        }
        return reducedMeasurements
      }
      else {
        return profileData[measField]
      }
    }
    else {
      return profileData[measField]
    }
  }

  roundArray(value){ return(Number(value).toFixed(3)) }

  makeColorChartDataArrays( profileData: BgcProfileData[] | CoreProfileData[],
                            yLabel: string, colorLabel: string, measKey: string,
                            reduceMeas: number, statParamsKey: string, includeQC?: boolean): DataArrays {
    let yMeas = []
    let cMeas = []
    let cQc = [] 
    let time = []
    let cycles = []
    let ids = []
    let _ids = []
    const colorQCLabel = colorLabel+'_qc'
    for(let idx=0; idx < profileData.length; idx++) {
        const pdat = profileData[idx]
        if (!pdat[measKey]) { continue }
        let meas = this.reduceGPSMeasurements(pdat, reduceMeas, measKey)
        meas = this.collateProfileMeasurements(meas, yLabel, colorLabel, includeQC)
        yMeas = yMeas.concat(meas[yLabel])
        cMeas = cMeas.concat(meas[colorLabel])
        if (includeQC) { cQc = cQc.concat(meas[colorQCLabel]) }
        const _id = pdat._id
        const timeStr = moment.utc(pdat.date).format('YYYY-MM-DD HH:mm')
        const cycle = pdat.cycle_number
        const station_parameters = pdat[statParamsKey]
        ids.push(_id)
        const plen = meas[yLabel].length
        const id_array = Array.apply(null, Array(plen)).map(String.prototype.valueOf,_id)
        const time_array = Array.apply(null, Array(plen)).map(String.prototype.valueOf,timeStr)
        const cycle_array = Array.apply(null, Array(plen)).map(Number.prototype.valueOf,cycle)
        _ids = _ids.concat(id_array)
        time = time.concat(time_array)
        cycles = cycles.concat(cycle_array)
    }
    let dataArrays  = {}
    dataArrays['x1'] = cMeas.map(this.roundArray)
    if (includeQC) { dataArrays['x1_qc'] = cQc }
    dataArrays['x2'] = yMeas.map(this.roundArray)
    dataArrays['ids'] = ids
    dataArrays['_ids'] = _ids
    dataArrays['cycle'] = cycles
    dataArrays['time'] = time
    dataArrays['x1_label'] = colorLabel
    dataArrays['x2_label'] = yLabel
    return (dataArrays as DataArrays)
  }

  make_line_chart_data_arrays( profileData: BgcProfileData[] | CoreProfileData[],
    yLabel: string, xLabel: string, measKey: string,
    reduceMeas: number, statParamsKey: string, includeQC?: boolean): DataArrays {
    let yMeas = []
    let xMeas = []
    let xQc = []
    let yQc = [] 
    let cycles = []
    let ids = []
    let _ids = []
    let time = []
    const xQCLabel = xLabel+'_qc'
    const yQCLabel = yLabel+'_qc'
    for(let idx=0; idx < profileData.length; idx++) {
        const pdat = profileData[idx]
        if (!pdat[measKey]) { continue }
        let meas = this.reduceGPSMeasurements(pdat, reduceMeas, measKey)
        meas = this.collateProfileMeasurements(meas, yLabel, xLabel, includeQC)
        yMeas = yMeas.concat(meas[yLabel])
        xMeas = xMeas.concat(meas[xLabel])
        if (includeQC) { 
          xQc = yQc.concat(meas[xQCLabel])
          yQc = yQc.concat(meas[yQCLabel])
         }
        const _id = pdat._id
        const cycle = pdat.cycle_number
        const station_parameters = pdat[statParamsKey]
        ids.push(_id)
        const plen = meas[yLabel].length
        const id_array = Array.apply(null, Array(plen)).map(String.prototype.valueOf,_id)
        const cycle_array = Array.apply(null, Array(plen)).map(Number.prototype.valueOf,cycle)
        const timeStr = moment.utc(pdat.date).format('YYYY-MM-DD HH:mm')
        const time_array = Array.apply(null, Array(plen)).map(String.prototype.valueOf,timeStr)
        time = time.concat(time_array)
        _ids = _ids.concat(id_array)
        cycles = cycles.concat(cycle_array)
    }
    let dataArrays  = {}
    dataArrays['x1'] = xMeas.map(this.roundArray)
    if (includeQC) { 
      dataArrays['x1_qc'] = xQc
      dataArrays['x2_qc'] = yQc
    }
    dataArrays['x2'] = yMeas.map(this.roundArray)
    dataArrays['ids'] = ids
    dataArrays['_ids'] = _ids
    dataArrays['cycle'] = cycles
    dataArrays['time'] = time
    dataArrays['x1_label'] = xLabel
    dataArrays['x2_label'] = yLabel
    return (dataArrays as DataArrays)
    }

  makeColorChartTrace(da: DataArrays, units: string, cmapName: string, key: string, includeQC: boolean, colorbarDomain: [number, number]) {
      let hovorText = []
      const text = da['x1_label'] + ':'
      if (includeQC) {
        for(let idx=0; idx < da['x1'].length; idx++){
          let pointText = this.makeColorChartText(da['x2'][idx], da['time'][idx], text, da['x1'][idx], units, da['cycle'][idx], da['x1_qc'][idx])
          hovorText.push(pointText)
      }
      }
      else {
        for(let idx=0; idx < da['x1'].length; idx++){
            let pointText = this.makeColorChartText(da['x2'][idx], da['time'][idx], text, da['x1'][idx], units, da['cycle'][idx])
            hovorText.push(pointText)
        }
    }
      const scatterTrace = {
          y: da['x2'],
          x: da['time'],
          text: hovorText,
          hoverinfo: 'text',
          showlegend: false,
          type: 'scattergl',
          mode: 'markers',
          cycle: da['cycle'],
          profile_ids: da['_ids'],
          marker: { color: da['x1'],
                      size: 5,
                      symbol: 'dot',
                      opacity: 1,
                      reversescale: false,
                      colorscale: this.getColorScale(cmapName),
                      cauto: false,
                      cmin: colorbarDomain[0],
                      cmax: colorbarDomain[1],
                  },
          name: key, 
      }
      return [scatterTrace]
  }

  make_line_chart_trace(da: DataArrays, key: string, includeQC: boolean, xunits: string, yunits: string) {
      let hovorText = []
      const xtext = da['x1_label'] + ':'
      const ytext = da['x2_label'] + ':'
      if (includeQC) {
        for(let idx=0; idx < da['x1'].length; idx++){
          let pointText = this.makeLineChartText(da['x1'][idx], da['x2'][idx], da['time'][idx], 
            xtext, ytext, xunits, yunits, da['cycle'][idx], da['x1_qc'][idx], da['x2_qc'][idx])
          hovorText.push(pointText)
      }
      }
      else {
        for(let idx=0; idx < da['x1'].length; idx++){
          let pointText = this.makeLineChartText(da['x1'][idx], da['x2'][idx], da['time'][idx], 
            xtext, ytext, xunits, yunits, da['cycle'][idx])
          hovorText.push(pointText)
          }
        }
      const scatterTrace = {
          y: da['x2'],
          x: da['x1'],
          text: hovorText,
          hoverinfo: 'text',
          showlegend: false,
          type: 'scattergl',
          mode: 'markers',
          cycle: da['cycle'],
          profile_ids: da['_ids'],
          marker: {   color: da['cycle'],
                      size: 5,
                      symbol: 'dot',
                      opacity: 1,
                      reversescale: false,
                      colorscale: this.getColorScale('diverge') // 'Jet'
                  },
          name: key, 
      }
      return [scatterTrace]
  }



  public get_trace_params(paramKey: string): TraceParam {
    let traceParam = {} as TraceParam
    const baseKey = paramKey.replace(/[0-9]/g, '')
    const waveLength = paramKey.replace(/[a-z_]/g, '')
    switch (baseKey) {
      case 'temp':
      case 'temp_ctd':
      case 'temp_btl':
      case 'potential_temperature_68_btl':
      case 'rev_temperature_btl':
      case 'partial_co2_temperature_btl':
      case 'ctd_temperature_68_ctd':
      case 'rev_temperature_90_btl':
      case 'ref_temperature_c_btl':
      case 'potential_temperature_btl':
      case 'rev_temperature_c_btl':
      case 'ctd_temperature_unk_btl':
      case 'ph_temperature_btl':
      case 'potential_temperature_c_btl':
      case 'ctd_temperature_unk_ctd':
      case 'fco2_temperature_btl':
      case 'ref_temperature_btl':
        traceParam['short_name'] = 'temp'
        traceParam['long_name'] = 'sea water temperature'
        traceParam['units'] = 'C'
        traceParam['long_units'] = 'Celcius'
        traceParam['title'] = "Temperature [Celsius]"
        traceParam['cmapName'] = 'thermal'
        traceParam['color'] = 'rgb(220,50,50)'
        break;
      case 'psal':
      case 'psal_ctd':
      case 'psal_btl':
      case 'salinity_btl':
        traceParam['short_name'] = 'psal'
        traceParam['long_name'] = 'salinity'
        traceParam['units'] = 'psu'
        traceParam['long_units'] = 'pounds per square inch'
        traceParam['title'] = "Salinity [psu]"
        traceParam['cmapName'] = 'haline'
        traceParam['color'] = 'rgb(133,212,227)'
        break;
      case 'pres':
        traceParam['short_name'] = 'pres'
        traceParam['long_name'] = 'sea water pressure'
        traceParam['units'] = 'dbar'
        traceParam['long_units'] = 'decibar'
        traceParam['title'] = "Pressure [dbar]"
        traceParam['cmapName'] = 'deep'
        traceParam['color'] = 'rgb(133,212,227)'
        break;
      case 'cndc':
        traceParam['short_name'] = 'cndc'
        traceParam['long_name'] = 'conductivity'
        traceParam['units'] = 'mohms/m'
        traceParam['long_units'] = 'miliohms per meter'
        traceParam['title'] = "Electrical Conductivity >[mohms/m]"
        traceParam['cmapName'] = 'amp' 
        traceParam['color'] = 'rgb(242,231,55)'
        break;
      case 'bbp':
        traceParam['short_name'] = 'bbp' + waveLength
        traceParam['long_name'] = 'particle back scattering at ' + waveLength + ' nanometers'
        traceParam['units'] = '1/m'
        traceParam['long_units'] = 'per meter'
        traceParam['title'] = 'Particle backscattering at ' + waveLength + ' nanometers [1/m]'
        traceParam['cmapName'] = 'matter' 
        traceParam['color'] = 'rgb(27,51,105)'
        traceParam['waveLength'] = waveLength
        break;
      case 'cp':
        traceParam['short_name'] = 'cp' + waveLength
        traceParam['long_name'] = 'particle beam attenuation at ' + waveLength + ' nanometers'
        traceParam['units'] = '1/m'
        traceParam['long_units'] = 'per meter'
        traceParam['title'] = 'Particle beam attenuation at ' + waveLength + ' nanometers [1/m]'
        traceParam['color']
        traceParam['cmapName'] = 'matter' 
        traceParam['color'] = 'rgb(189,200,202)'
        traceParam['waveLength'] = waveLength
        break;
      case 'doxy':
      case 'doxy_ctd':
      case 'del_oxygen_18_error_btl':
      case 'oxygen_btl':
      case 'oxygen_ml_l_btl':
      case 'del_oxygen_18_btl':
      case 'ctd_oxygen_ml_l_ctd':
      case 'doxy_btl':
        traceParam['short_name'] = 'doxy'
        traceParam['long_name'] = 'dissolved oxygen'
        traceParam['units'] = 'uMol/kg'
        traceParam['long_units'] = 'micromole per kilogram'
        traceParam['title'] = 'Dissolved Oxygen [micromole/kg]'
        traceParam['cmapName'] = 'oxy' 
        traceParam['color'] = 'rgb(242,231,55)'
        break;
      case 'chla':
      case 'chlorophyll_a_ug_kg_btl':
      case 'chlorophyll_a_btl':
        traceParam['short_name'] = 'chla'
        traceParam['long_name'] = 'chlorophill-a'
        traceParam['units'] = 'mg/m3'
        traceParam['long_units'] = 'miligram per cubic meter'
        traceParam['title'] = 'Chlorophyll-A [mg/m3]'
        traceParam['cmapName'] = 'algae' 
        traceParam['color'] = 'rgb(237,113,62)'
        break;
      case 'cdom':
        traceParam['short_name'] = 'cdom'
        traceParam['long_name'] = 'concentration of coloured dissolved organic matter in sea water'
        traceParam['units'] = 'ppb'
        traceParam['long_units'] = 'parts per billion'
        traceParam['title'] = 'Concentration of coloured dissolved <br>organic matter in sea water [ppb]'
        traceParam['cmapName'] = 'algae' 
        traceParam['color'] = 'rgb(133,212,227)'
        break;
      case 'nitrate':
      case 'nitrite_nitrate_btl':
      case 'nitrate_btl':
        traceParam['short_name'] = 'nitrate'
        traceParam['long_name'] = 'nitrate'
        traceParam['units'] = 'uMol/kg'
        traceParam['long_units'] = 'micromole per kilogram'
        traceParam['title'] = 'Nitrate [micromole/kg]'
        traceParam['cmapName'] = 'algae' 
        traceParam['color'] = 'rgb(40,177,161)'
        break;
      case 'turbidity':
        traceParam['short_name'] = 'turbidity'
        traceParam['long_name'] = 'sea water turbidity'
        traceParam['units'] = 'ntu'
        traceParam['long_units'] = 'nephelometric turbidity units'
        traceParam['title'] = 'Sea water turbidity [ntu]'
        traceParam['cmapName'] = 'turbid' 
        traceParam['color'] = 'rgb(27,51,105)'
        break;
      case 'bisulfide':
        traceParam['short_name'] = 'bisulfide'
        traceParam['long_name'] = 'bisulfide'
        traceParam['units'] = 'uMol/kg'
        traceParam['long_units'] = 'micromole per kilogram'
        traceParam['title'] = 'Bisulfide [micromole/kg]'
        traceParam['cmapName'] = 'solar' 
        traceParam['color'] = 'rgb(242,231,55)'
        break;
      case 'ph_in_situ_total':
      case 'ph_sws_btl':
      case 'ph_total_h_scale_btl':
        traceParam['short_name'] = 'pH'
        traceParam['long_name'] = 'sea water ph reported on total scale'
        traceParam['units'] = ''
        traceParam['long_units'] = ''
        traceParam['title'] = 'pH in situ total [ ]'
        traceParam['cmapName'] = 'gray' 
        traceParam['color'] = 'rgb(242,231,55)'
        break;
      case 'down_irradiance':
        traceParam['short_name'] = 'down irradiance'
        traceParam['long_name'] = 'downwelling irradiance at' + waveLength + ' nanometers'
        traceParam['units'] = 'W/m^2/nm'
        traceParam['long_units'] = 'Watts per meter squared per nanometers'
        traceParam['title'] = 'Downwelling irradiance at ' + waveLength + ' nanometers [W/m^2/nm]'
        traceParam['cmapName'] = 'matter' 
        traceParam['color'] = 'rgb(66,50,49)'
        traceParam['waveLength'] = waveLength
        break;
      case 'up_irradiance':
        traceParam['short_name'] = 'up irradiance'
        traceParam['long_name'] = 'upwelling irradiance at' + waveLength + ' nanometers'
        traceParam['units'] = 'W/m^2/nm'
        traceParam['long_units'] = 'Watts per meter squared per nanometers'
        traceParam['title'] = 'Upwelling irradiance at ' + waveLength + ' nanometers [W/m^2/nm]'
        traceParam['cmapName'] = 'matter' 
        traceParam['color'] = 'rgb(222,189,153)'
        traceParam['waveLength'] = waveLength
        break;
      case 'downwelling_par':
        traceParam['short_name'] = 'down par'
        traceParam['long_name'] = 'downwelling photosynthetic available radiation <br> [uMol Quanta/m^2/sec]'
        traceParam['units'] = ' uMol Quanta/m^2/sec'
        traceParam['long_units'] = 'micromole quanta per meters squared per second'
        traceParam['title'] = 'Downwelling photosynthetic available radiation <br> [uMol Quanta/m^2/sec]'
        traceParam['cmapName'] = 'solar' 
        traceParam['color'] = 'rgb(73,112,109)'
        break;
      default:
        traceParam['short_name'] = 'not listed'
        traceParam['long_name'] = 'not listed'
        traceParam['units'] = ''
        traceParam['long_units'] = ''
        traceParam['title'] = ''
        traceParam['cmapName'] = '' 
        traceParam['color'] = 'rgb(66,50,49)'
      }
    return traceParam
  }

  public getColorScale(cmapName: string): [number, string][] {
    const cmap = HEX_COLOR_MAPS[cmapName.toLocaleLowerCase()] as string[]

    let plotlyMap = []
    for( let idx=0; idx<cmap.length; ++idx) {
      plotlyMap.push([idx/(cmap.length-1), cmap[idx]])
    }
    return plotlyMap
  }


}
