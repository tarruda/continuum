import {
  floor,
  abs
} from '@math';

import {
  NaN,
  isFinite,
  isNaN
} from '@number';

import {
  OrdinaryCreateFromConstructor,
  OrdinaryToPrimitive,
  IsCallable,
  ToInteger,
  ToNumber,
  ToObject,
  ToPrimitive,
  ToString
} from '@@operations';

import {
  $$ArgumentCount,
  $$Call,
  $$CallerHasArgument,
  $$Exception,
  $$HasArgument,
  $$IsConstruct,
  $$Now,
  $$ParseDate,
  $$RegexExec
} from '@@internals';

import {
  create,
  zeroPad
} from '@@utilities';

import {
  DST_START_MONTH,
  DST_START_SUNDAY,
  DST_START_OFFSET,
  DST_END_MONTH,
  DST_END_SUNDAY,
  DST_END_OFFSET,
  LOCAL_TZ
} from '@@constants';

import {
  BuiltinDate,
  create     : @@create,
  DateValue  : @@DateValue,
  NativeBrand: @@NativeBrand,
  ToPrimitive: @@ToPrimitive
} from '@@symbols';


// ###############################################
// ### 15.9.1.2 Day Number and Time within Day ###
// ###############################################

const msPerDay = 86400000;

function Day(t){
  return floor(t / msPerDay);
}

function TimeWithinDay(t){
  return t % msPerDay;
}


// ############################
// ### 15.9.1.3 Year Number ###
// ############################

function DaysInYear(y){
  if (y % 4) {
    return 365;
  } else if (y % 100) {
    return 366;
  } else if (y % 400) {
    return 365;
  }
  return 366;
}

function DayFromYear(y){
  return 365 * (y - 1970) + floor((y - 1969) / 4) - floor((y - 1901) / 100) + floor((y - 1601) / 400);
}

function TimeFromYear(y){
  return msPerDay * DayFromYear(y);
}

function YearFromTime(t) {
  let year = floor(t / (msPerDay * 365.2425)) + 1970;
  const t2 = TimeFromYear(year);

  if (t2 > t) {
    year--;
  } else if (t2 + msPerDay * DaysInYear(year) <= t) {
    year++;
  }

  return year;
}

function InLeapYear(t){
  return DaysInYear(YearFromTime(t)) - 365;
}


// #############################
// ### 15.9.1.4 Month Number ###
// #############################

const OFFSETS      = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365],
      LEAP_OFFSETS = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];

function offsets(t){
  return InLeapYear(t) ? LEAP_OFFSETS : OFFSETS
}

function MonthFromTime(t){
  const days = offsets(t),
        day  = DayWithinYear(t);

  if (day < days[6]) {
    if (day < days[3]) {
      if (day < days[1]) {
        return 0;
      } else if (day < days[2]) {
        return 1;
      } else {
        return 2;
      }
    } else if (day < days[4]) {
      return 3;
    } else if (day < days[5]) {
      return 4;
    } else {
      return 5;
    }
  } else if (day < days[9]) {
    if (day < days[7]) {
      return 6;
    } else if (day < days[8]) {
      return 7;
    } else {
      return 8;
    }
  } else if (day < days[10]) {
    return 9;
  } else if (day < days[11]) {
    return 10;
  } else {
    return 11;
  }
}

function DayWithinYear(t){
  return Day(t) - DayFromYear(YearFromTime(t));
}


// ############################
// ### 15.9.1.5 Date Number ###
// ############################

function DateFromTime(t){
  return DayWithinYear(t) - offsets(t)[MonthFromTime(t)] + 1;
}


// #########################
// ### 15.9.1.6 Week Day ###
// #########################

function WeekDay(t){
  return (Day(t) + 4) % 7;
}


// ###########################################
// ### 15.9.1.7 Local Time Zone Adjustment ###
// ###########################################

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      LocalTZA   = (LOCAL_TZ - (DaylightSavingTA($$Now()) ? 1 : 0)) * 3600000;


// ################################################
// ### 15.9.1.8 Daylight Saving Time Adjustment ###
// ################################################


function daysInMonth(m, leap) {
  m %= 12;
  if (m === 1) {
    return 28 + leap;
  }
  return MONTH_DAYS[m];
}

function getSundayInMonth(t, m, count){
  const leap = InLeapYear(t);
  let sunday = TimeFromYear(YearFromTime(t)) + daysInMonth(m, leap) * msPerDay;

  if (count) {
    sunday += daysInMonth(m, leap) * msPerDay;
    while (WeekDay(sunday)) {
      sunday -= msPerDay
    }
  } else {
    while (WeekDay(sunday)) {
      sunday += msPerDay
    }
    sunday += 7 * msPerDay * (count - 1);
  }

  return sunday;
}

function DaylightSavingTA(t) {
  if (t >= getSundayInMonth(t, DST_START_MONTH, DST_START_SUNmsPerDay) + DST_START_OFFSET) {
    if (t < getSundayInMonth(t, DST_END_MONTH, DST_END_SUNmsPerDay) + DST_END_OFFSET) {
      return 3600000;
    }
  }
  return 0;
}


// ###########################
// ### 15.9.1.9 Local Time ###
// ###########################

function LocalTime(t){
  return t + LocalTZA + DaylightSavingTA(t);
}

function FromUTC(t){
  t -= LocalTZA;
  return t - DaylightSavingTA(t);
}


// ##########################################################
// ### 15.9.1.10 Hours, Minutes, Second, and Milliseconds ###
// ##########################################################

const HoursPerDay      = 24
      MinutesPerHour   = 60
      SecondsPerMinute = 60
      msPerSecond      = 1000,
      msPerMinute      = 60 * msPerSecond,
      msPerHour        = 60 * msPerMinute;

function HourFromTime(t){
  return floor(t / msPerHour) % HoursPerDay;
}

function MinFromTime(t){
  return floor(t / msPerMinute) % MinutesPerHour;
}

function SecFromTime(t){
  return floor(t / msPerSecond) % SecondsPerMinute;
}

function msFromTime(t){
  return t % msPerSecond;
}


// ##########################
// ### 15.9.1.11 MakeTime ###
// ##########################

function MakeTime(hour, min, sec, ms){
  if (!(isFinite(hour) && isFinite(min) && isFinite(sec) && isFinite(ms))) {
    return NaN;
  }

  hour = ToInteger(hour);
  min = ToInteger(min);
  sec = ToInteger(sec);
  ms = ToInteger(ms);

  return hour * msPerHour + min * msPerMinute + sec * msPerSecond + ms;
}


// #########################
// ### 15.9.1.12 MakeDay ###
// #########################

function MakeDay(year, month, date) {
  if (!(isFinite(year) && isFinite(month) && isFinite(date))) {
    return NaN;
  }

  year = ToInteger(year);
  month = ToInteger(month);
  date = ToInteger(date);

  let t = year < 1970 ? 1 : 0;

  if (year < 1970){
    for (var i = 1969; i >= year; i--) {
      t -= DaysInYear(i) * msPerDay;
    }
  } else {
    for (var i = 1970; i < year; i++) {
      t += DaysInYear(i) * msPerDay;
    }
  }

  const days = offsets(t);
  for (var i = 0; i < month; i++) {
    t += days[i] * msPerDay;
  }

  if (YearFromTime(t) !== year + floor(month / 12) || MonthFromTime(t) !== month % 12 || DateFromTime(t) !== 1) {
    return NaN;
  }
  return Day(t) + date - 1;
}

// function MakeDay(year, month, date) {
//   if (!(isFinite(year) && isFinite(month) && isFinite(date))) {
//     return NaN;
//   }

//   year = ToInteger(year);
//   month = ToInteger(month);
//   date = ToInteger(date);

//   return DayFromYear(year) + daysInMonth(month, InLeapYear(year)) + date - 1;
// }


// ##########################
// ### 15.9.1.13 MakeDate ###
// ##########################

function MakeDate(day, time){
  if(!(isFinite(day) && isFinite(time))) {
    return NaN;
  }

  return day * msPerDay + time;
}


// ##########################
// ### 15.9.1.14 TimeClip ###
// ##########################

function TimeClip(time){
  if(!isFinite(time) || abs(time) > 864e13){
    return NaN;
  }

  return ToInteger(time) + 0;
}


// ####################
// ### Date Getters ###
// ####################

function getTimezone(obj, divisor){
  const t = obj.@@DateValue;
  return isNaN(t) ? t : (t - LocalTime(t)) / divisor;
}

function getTime(obj, utc, callback){
  const t = obj.@@DateValue;
  return isNaN(t) ? t : callback(utc ? t : LocalTime(t));
}


// ####################
// ### Date Setters ###
// ####################

function makeDate(obj, date){
  const t  = LocalTime(obj.@@DateValue),
        dt = ToNumber(date);

  return MakeDate(MakeDay(YearFromTime(t), MonthFromTime(t), dt), TimeWithinDay(t));
}

function makeFullYear(obj, year, month, date){
  const t  = LocalTime(obj.@@DateValue),
        y  = ToNumber(year),
        m  = $$CallerHasArgument('month') ? ToNumber(month) : MonthFromTime(t),
        dt = $$CallerHasArgument('date')  ? ToNumber(date)  : DateFromTime(t);

  return MakeDate(MakeDay(y, m, dt), TimeWithinDay(t));
}

function makeHours(obj, hour, min, sec, ms){
  const t     = LocalTime(obj.@@DateValue),
        h     = ToNumber(hour),
        m     = $$CallerHasArgument('min') ? ToNumber(min) : MinFromTime(t),
        s     = $$CallerHasArgument('sec') ? ToNumber(sec) : SecFromTime(t),
        milli = $$CallerHasArgument('ms')  ? ToNumber(ms)  : msFromTime(t);

  return MakeDate(Day(t), MakeTime(h, m, s, milli));
}

function makeMilliseconds(obj, ms){
  const t     = LocalTime(obj.@@DateValue),
        milli = ToNumber(ms),
        time  = MakeTime(HourFromTime(t), MinFromTime(t), SecFromTime(t), milli);

  return MakeDate(Day(t), time);
}

function makeMinutes(obj, min, sec, ms){
  const t     = LocalTime(obj.@@DateValue),
        m     = ToNumber(min),
        s     = $$CallerHasArgument('sec') ? ToNumber(sec) : SecFromTime(t),
        milli = $$CallerHasArgument('ms')  ? ToNumber(ms)  : msFromTime(t);

  return MakeDate(Day(t), MakeTime(HourFromTime(t), m, s, milli));
}

function makeMonth(obj, month, date){
  const t  = LocalTime(obj.@@DateValue),
        m  = ToNumber(month),
        dt = $$CallerHasArgument('date') ? ToNumber(date) : DateFromTime(t);

  return MakeDate(MakeDay(YearFromTime(t), m, dt), TimeWithinDay(t));
}

function makeSeconds(obj, sec, ms){
  const t     = LocalTime(obj.@@DateValue),
        sec   = ToNumber(sec),
        milli = $$CallerHasArgument('ms') ? ToNumber(ms) : msFromTime(t);

  return MakeDate(Day(t), MakeTime(HourFromTime(t), MinFromTime(t), sec, milli));
}


// ##################################
// ### Date to String Conversions ###
// ##################################

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toString(obj){
  return toDateString(obj)+' '+toTimeString(obj);
}

function toDateString(obj){
  const weekday = DAYS[getTime(obj, false, WeekDay)],
        month   = MONTHS[getTime(obj, false, MonthFromTime)],
        date    = pad(getTime(obj, false, DateFromTime)),
        year    = pad(getTime(obj, false, YearFromTime), 4);

  return `${weekday} ${month} ${date} ${year}`;
}

function toTimeString(obj){
  const timezone = getTimezone(obj, msPerHour),
        hour     = pad(getTime(obj, false, HourFromTime)),
        min      = pad(getTime(obj, false, MinFromTime)),
        sec      = pad(getTime(obj, false, SecFromTime)),
        tz       = (timezone < 0 ? '+' : '-') + pad(abs(timezone) * 100, 4);

  return `${hour}:${min}:${sec} GMT${tz}`;
}

function toLocaleDateString(obj){
  const month = pad(getTime(obj, false, MonthFromTime) + 1),
        date  = pad(getTime(obj, false, DateFromTime)),
        year  = pad(getTime(obj, false, YearFromTime), 4);

  return `${month}/${date}/${year}`;
}

function toLocaleTimeString(obj){
  const h        = getTime(obj, false, HourFromTime),
        hour     = h % 12,
        min      = pad(getTime(obj, false, MinFromTime)),
        sec      = pad(getTime(obj, false, SecFromTime)),
        meridiem = h === hour ? 'AM' : 'PM';

  return `${hour}:${min}:${sec} ${meridiem}`;
}


// ###########################
// ### 15.9.4.2 Date.parse ###
// ###########################

const dateRegex = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;

export function parse(date){
  const match = $$RegexExec(dateRegex, ToString(date));

  if (!match) {
    return $$ParseDate(date);
  }

  let [, year, month, date, hours, minutes, seconds, ms, tzsep, sign, tzhours, tzminutes] = match;

  if (tzsep !== 'Z' && sign !== undefined) {
    let tz = tzhours * 60 + tzminutes;
    if (sign === '+') {
      tz = 0 - tz;
    }
    minutes += tz;
  }

  return UTC(ToNumber(year) || 0, (ToNumber(month) || 1) - 1, date, hours, minutes, seconds, ms);
}


// #########################
// ### 15.9.4.3 Date.UTC ###
// #########################

export function UTC(year, month, date = 1, hours = 0, minutes = 0, seconds = 0, ms = 0){
  const y     = ToNumber(year),
        m     = ToNumber(month),
        dt    = ToNumber(date),
        h     = ToNumber(hours),
        min   = ToNumber(minutes),
        s     = ToNumber(seconds),
        milli = ToNumber(ms);

  const yInt = ToInteger(y),
        yr   = !isNaN(y) && 0 <= yInt && yInt <= 99 ? y + 1900 : y;

  return TimeClip(MakeDate(MakeDay(yr, m, dt), MakeTime(h, min, s, milli)));
}


// #########################
// ### 15.9.4.4 Date.now ###
// #########################

export function now(){
  return $$Now();
}


// ######################################################
// ### 15.9.5 Properties of the Date Prototype Object ###
// ######################################################

export class Date {
  // ###########################################
  // ### 15.9.5.1 Date.prototype.constructor ###
  // ###########################################
  constructor(year, month, date, hours, minutes, seconds, ms){
    if (!$$IsConstruct()) {
      // 15.9.2 The Date Constructor Called as a Function
      return toString(new Date);
    }

    // 15.9.3 The Date Constructor
    const argc = $$ArgumentCount();

    if (argc > 1) {
      // 15.9.3.1 new Date (year, month [, date [, hours [, minutes [, seconds [, ms ] ] ] ] ] )
      const y     = ToNumber(year),
            m     = ToNumber(month),
            dt    = $$HasArgument('date')    ? ToNumber(date)    : 1,
            h     = $$HasArgument('hours')   ? ToNumber(hours)   : 0,
            min   = $$HasArgument('minutes') ? ToNumber(minutes) : 0,
            s     = $$HasArgument('seconds') ? ToNumber(seconds) : 0,
            milli = $$HasArgument('ms')      ? ToNumber(ms)      : 0;

      const yInt = ToInteger(y),
            yr   = !isNaN(y) && 0 <= yInt && yInt <= 99 ? y + 1900 : y;

      const finalDate = MakeDate(MakeDay(yr, m, dt), MakeTime(h, min, s, milli));

      this.@@DateValue = TimeClip(FromUTC(finalDate));
    } else if (argc === 1) {
      // 15.9.3.2 new Date (value)
      const date = ToPrimitive(year);
      this.@@DateValue = TimeClip(typeof date === 'string' ? parse(date) : date);
    } else {
      // 15.9.3.3 new Date ( )
      this.@@DateValue = $$Now();
    }
  }

  // ########################################
  // ### 15.9.5.2 Date.prototype.toString ###
  // ########################################
  toString(){
    return toString(this);
  }
  // ############################################
  // ### 15.9.5.3 Date.prototype.toDateString ###
  // ############################################
  toDateString(){
    return toDateString(this);
  }
  // ############################################
  // ### 15.9.5.4 Date.prototype.toTimeString ###
  // ############################################
  toTimeString(){
    return toTimeString(this);
  }
  // ##############################################
  // ### 15.9.5.5 Date.prototype.toLocaleString ###
  // ##############################################
  toLocaleString(){
    return toLocaleDateString(this)+' '+toLocaleTimeString(this);
  }
  // ##################################################
  // ### 15.9.5.6 Date.prototype.toLocaleDateString ###
  // ##################################################
  toLocaleDateString(){
    return toLocaleDateString(this);
  }
  // ##################################################
  // ### 15.9.5.7 Date.prototype.toLocaleTimeString ###
  // ##################################################
  toLocaleTimeString(){
    return toLocaleTimeString(this);
  }
  // #######################################
  // ### 15.9.5.8 Date.prototype.valueOf ###
  // #######################################
  valueOf(){
    return this.@@DateValue;
  }

  // #######################################
  // ### 15.9.5.9 Date.prototype.getTime ###
  // #######################################
  getTime(){
    return this.@@DateValue;
  }
  // ############################################
  // ### 15.9.5.10 Date.prototype.getFullYear ###
  // ############################################
  getFullYear(){
    return getTime(this, false, YearFromTime);
  }
  // ###############################################
  // ### 15.9.5.11 Date.prototype.getUTCFullYear ###
  // ###############################################
  getUTCFullYear(){
    return getTime(this, true, YearFromTime);
  }
  // #########################################
  // ### 15.9.5.12 Date.prototype.getMonth ###
  // #########################################
  getMonth(){
    return getTime(this, false, MonthFromTime);
  }
  // ############################################
  // ### 15.9.5.13 Date.prototype.getUTCMonth ###
  // ############################################
  getUTCMonth(){
    return getTime(this, true, MonthFromTime);
  }
  // ########################################
  // ### 15.9.5.14 Date.prototype.getDate ###
  // ########################################
  getDate(){
    return getTime(this, false, DateFromTime);
  }
  // ###########################################
  // ### 15.9.5.15 Date.prototype.getUTCDate ###
  // ###########################################
  getUTCDate(){
    return getTime(this, true, DateFromTime);
  }
  // #######################################
  // ### 15.9.5.16 Date.prototype.getDay ###
  // #######################################
  getDay(){
    return getTime(this, false, WeekDay);
  }
  // ##########################################
  // ### 15.9.5.17 Date.prototype.getUTCDay ###
  // ##########################################
  getUTCDay(){
    return getTime(this, true, WeekDay);
  }
  // #########################################
  // ### 15.9.5.18 Date.prototype.getHours ###
  // #########################################
  getHours(){
    return getTime(this, false, HourFromTime);
  }
  // ############################################
  // ### 15.9.5.19 Date.prototype.getUTCHours ###
  // ############################################
  getUTCHours(){
    return getTime(this, true, HourFromTime);
  }
  // ###########################################
  // ### 15.9.5.20 Date.prototype.getMinutes ###
  // ###########################################
  getMinutes(){
    return getTime(this, false, MinFromTime);
  }
  // ##############################################
  // ### 15.9.5.21 Date.prototype.getUTCMinutes ###
  // ##############################################
  getUTCMinutes(){
    return getTime(this, true, MinFromTime);
  }
  // ###########################################
  // ### 15.9.5.22 Date.prototype.getSeconds ###
  // ###########################################
  getSeconds(){
    return getTime(this, false, SecFromTime);
  }
  // ##############################################
  // ### 15.9.5.23 Date.prototype.getUTCSeconds ###
  // ##############################################
  getUTCSeconds(){
    return getTime(this, true, SecFromTime);
  }
  // ################################################
  // ### 15.9.5.24 Date.prototype.getMilliseconds ###
  // ################################################
  getMilliseconds(){
    return getTime(this, false, msFromTime);
  }
  // ###################################################
  // ### 15.9.5.25 Date.prototype.getUTCMilliseconds ###
  // ###################################################
  getUTCMilliseconds(){
    return getTime(this, true, msFromTime);
  }

  // ##################################################
  // ### 15.9.5.26 Date.prototype.getTimezoneOffset ###
  // ##################################################
  getTimezoneOffset(){
    return getTimezone(this, msPerMinute);
  }

  // ########################################
  // ### 15.9.5.27 Date.prototype.setTime ###
  // ########################################
  setTime(time){
    return this.@@DateValue = TimeClip(ToNumber(time));
  }
  // ################################################
  // ### 15.9.5.28 Date.prototype.setMilliseconds ###
  // ################################################
  setMilliseconds(ms){
    return this.@@DateValue = TimeClip(FromUTC(makeMilliseconds(this, ms)));
  }
  // ###################################################
  // ### 15.9.5.29 Date.prototype.setUTCMilliseconds ###
  // ###################################################
  setUTCMilliseconds(ms){
    return this.@@DateValue = TimeClip(makeMilliseconds(this, ms));
  }
  // ###########################################
  // ### 15.9.5.30 Date.prototype.setSeconds ###
  // ###########################################
  setSeconds(sec, ms){
    return this.@@DateValue = TimeClip(FromUTC(makeSeconds(this, sec, ms)));
  }
  // ##############################################
  // ### 15.9.5.31 Date.prototype.setUTCSeconds ###
  // ##############################################
  setUTCSeconds(sec, ms){
    return this.@@DateValue = TimeClip(makeSeconds(this, sec, ms));
  }
  // ###########################################
  // ### 15.9.5.32 Date.prototype.setMinutes ###
  // ###########################################
  setMinutes(min, sec, ms){
    return this.@@DateValue = TimeClip(FromUTC(makeMinutes(this, min, sec, ms)));
  }
  // ##############################################
  // ### 15.9.5.33 Date.prototype.setUTCMinutes ###
  // ##############################################
  setUTCMinutes(min, sec, ms){
    return this.@@DateValue = TimeClip(makeMinutes(this, min, sec, ms));
  }
  // #########################################
  // ### 15.9.5.34 Date.prototype.setHours ###
  // #########################################
  setHours(hour, min, sec, ms){
    return this.@@DateValue = TimeClip(FromUTC(makeHours(this, hour, min, sec, ms)));
  }
  // ############################################
  // ### 15.9.5.35 Date.prototype.setUTCHours ###
  // ############################################
  setUTCHours(hour, min, sec, ms){
    return this.@@DateValue = TimeClip(makeHours(this, hour, min, sec, ms));
  }
  // ########################################
  // ### 15.9.5.36 Date.prototype.setDate ###
  // ########################################
  setDate(date){
    return this.@@DateValue = TimeClip(FromUTC(makeDate(this, date)));
  }
  // ###########################################
  // ### 15.9.5.37 Date.prototype.setUTCDate ###
  // ###########################################
  setUTCDate(date){
    return this.@@DateValue = TimeClip(makeDate(this, date));
  }
  // #########################################
  // ### 15.9.5.38 Date.prototype.setMonth ###
  // #########################################
  setMonth(month, date){
    return this.@@DateValue = TimeClip(FromUTC(makeMonth(this, month, date)));
  }
  // ############################################
  // ### 15.9.5.39 Date.prototype.setUTCMonth ###
  // ############################################
  setUTCMonth(month, date){
    return this.@@DateValue = TimeClip(makeMonth(this, month, date));
  }
  // ############################################
  // ### 15.9.5.40 Date.prototype.setFullYear ###
  // ############################################
  setFullYear(year, month, date){
    return this.@@DateValue = TimeClip(FromUTC(makeFullYear(this, year, month, date)));
  }
  // ###############################################
  // ### 15.9.5.41 Date.prototype.setUTCFullYear ###
  // ###############################################
  setUTCFullYear(year, month, date){
    return this.@@DateValue = TimeClip(makeFullYear(this, year, month, date));
  }

  // ############################################
  // ### 15.9.5.42 Date.prototype.toUTCString ###
  // ############################################
  toUTCString(){
    const weekday = DAYS[getTime(this, true, WeekDay)],
          date    = pad(getTime(this, true, DateFromTime)),
          month   = MONTHS[getTime(this, true, MonthFromTime)],
          year    = pad(getTime(this, true, YearFromTime), 4),
          hour    = pad(getTime(this, true, HourFromTime)),
          min     = pad(getTime(this, true, MinFromTime)),
          sec     = pad(getTime(this, true, SecFromTime));

    return `${weekday}, ${date} ${month} ${year} ${hour}:${min}:${sec} GMT`;
  }
  // ############################################
  // ### 15.9.5.43 Date.prototype.toISOString ###
  // ############################################
  toISOString(){
   const year  = pad(getTime(this, true, YearFromTime), 4),
         month = pad(getTime(this, true, MonthFromTime) + 1),
         date  = pad(getTime(this, true, DateFromTime)),
         hour  = pad(getTime(this, true, HourFromTime)),
         min   = pad(getTime(this, true, MinFromTime)),
         sec   = pad(getTime(this, true, SecFromTime)),
         ms    = pad(getTime(this, true, msFromTime), 2);

    return `${year}-${month}-${date}T${hour}:${min}:${sec}.${ms}Z`;
  }
  // #######################################
  // ### 15.9.5.44 Date.prototype.toJSON ###
  // #######################################
  toJSON(){
    const obj = ToObject(this);

    if (!isFinite(ToPrimitive(obj, 'Number'))) {
      return null;
    }

    const toISO = obj.toISOString;

    if (!IsCallable(toISO)) {
      throw $$Exception('called_non_callable', ['toISOString']);
    }

    return $$Call(toISO, obj, []);
  }

  // ##############################################
  // ### 15.9.5.45 Date.prototype.@@ToPrimitive ###
  // ##############################################
  @@ToPrimitive(hint){
    if (Type(this) !== 'Object') {
      throw $$Exception('cannot_convert_to_primitive2', ['Date.prototype.@@ToPrimitive']);
    }

    const tryFirst = hint === 'string' || hint === 'default' ? 'string' : 'number';

    return OrdinaryToPrimitive(this, tryFirst);
  }
}


const DatePrototype = Date.prototype;

extend(Date, { parse, UTC, now });

extend(Date, {
  // 15.9.4.6 Date.@@create
  @@create(){
    const obj = OrdinaryCreateFromConstructor(this, DatePrototype);
    obj.@@DateValue = undefined;
    obj.@@NativeBrand = BuiltinDate;
    return obj;
  }
});
