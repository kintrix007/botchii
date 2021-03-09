export default class Time {
    public time:   number = 0;
    public hour:   number = 0;
    public minute: number = 0;
    
    constructor(time: Date | number | string, minutes: number | undefined = undefined) {
        if (typeof(time) === "string" && minutes === undefined) {
            const hourStr = time.slice(0, 2);
            const minuteStr = time.slice(3, 5);
            this.hour = parseInt(hourStr);
            this.minute = parseInt(minuteStr);
            this.time = this.hour * 60 + this.minute;
        } else
        if (time instanceof Date && minutes === undefined) {
            this.hour = time.getHours();
            this.minute = time.getMinutes();
            this.time = this.hour * 60 + this.minute;
        }
        if (typeof(time) === "number") {
            if (minutes === undefined) {
                this.time = time;
                this.hour = Math.floor(this.time / 60);
                this.minute = this.time % 60;
            } else {
                this.hour = time;
                this.minute = minutes;
                this.time = this.hour * 60 + this.minute;
            }
        }
    }

    add(timeObj: Time): Time {
        return new Time(this.time + timeObj.time);
    }

    equals(time: Time) {
        return this.time === time.time;
    }

    valueOf() {
        return this.time;
    }

    toString() {
        let h = `${this.hour < 10 ? "0" : ""}${this.hour}`;
        let m = `${this.minute < 10 ? "0" : ""}${this.minute}`;
        return `${h}:${m}`;
    }
};
