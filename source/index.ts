import * as Utilz from "./classes/utilz";
import * as types from "./classes/types";
import Time from "./classes/time";
import { createCmdsListeners } from "./commands";
import * as fs from "fs";
import * as yaml from "yaml";
import * as DC from "discord.js";
import * as path from "path";
import { config } from "dotenv";

config();
const client = new DC.Client();

const DEFAULT_PREFIX = "!";
const CMDS_DIR = path.join(__dirname, "cmds");
const SOURCE_DIR = Utilz.sourceDir;
const TIMETABLE_DIR = path.join(SOURCE_DIR, "timetable");
const STUDENTS_DIR = path.join(SOURCE_DIR, "students");

function main() {
    const timetable = loadTimetableData();
    const students = loadStudentData();

    client.on("ready", async () => {
        console.log("-- bot online --");

        await createCmdsListeners(data, CMDS_DIR);
        
        const currentTime = new Time(new Date());
        console.log("the current time is:", currentTime.toString());
        console.log("-- bot setup complete --");
    });

    const data: types.Data = {
        client: client,
        timetable: timetable,
        students: students,
        defaultPrefix: DEFAULT_PREFIX
    };

    console.log("-- authenticating bot... --");
    loginBot()
    .then(async () => {
        console.log("-- bot successfully authenticated --");
    }).catch(console.error);
}

function loginBot() {
    const token = process.env.TOKEN;
    return client.login(token);
}

function loadTimetableData(): types.Timetable {
    const daysList = ["monday", "tuesday", "wednesday", "thursday", "friday"];

    interface LessonRaw {
        subj: string;
        start: string;
        length: number;
        elective: boolean;
    }

    const timetable: types.Timetable = {};
    daysList.forEach(day => {
        const dayPath = path.join(TIMETABLE_DIR, `${day}.yaml`);
        
        const dayDataRaw = fs.readFileSync(dayPath).toString();
        const dayData: LessonRaw[] = yaml.parse(dayDataRaw);

        const convertedDayData : types.TimetableDay = dayData.map(x => {
            const lesson: types.Lesson = {
                subj: x.subj,
                start: new Time(x.start),
                end: new Time(x.start).add(new Time(x.length)),
                length: x.length,
                elective: x.elective
            };
            return lesson;
        }).sort((lesson1, lesson2) => Math.sign(lesson1.start.time - lesson2.start.time));
        timetable[day] = convertedDayData;
    });

    return timetable;
}

function loadStudentData(): types.Students {
    const rosterPath = path.join(STUDENTS_DIR, "roster.yaml");
    const rosterRaw = fs.readFileSync(rosterPath).toString();
    const roster: string[] = yaml.parse(rosterRaw);

    const lessonsPath = path.join(STUDENTS_DIR, "lessons.yaml");
    const lessonsRaw = fs.readFileSync(lessonsPath).toString();
    const lessonsStudents: types.LessonsAttendants = yaml.parse(lessonsRaw);

    const studentsLessons: types.StudentsLessons = {};
    roster.forEach(student => {
        const lessons = Object.entries(lessonsStudents).map(([lesson, lessonAttendants]) => {
            const hasAsObligatory = lessonAttendants.obligatory?.includes(student);
            const hasAsElective = lessonAttendants.elective?.includes(student);
            const hasLessons: types.LessonData[] = [];
            if (hasAsObligatory) hasLessons.push({subj: lesson, elective: false});
            if (hasAsElective) hasLessons.push({subj: lesson, elective: true});
            return hasLessons;
        }).reduce((a, b) => [...a, ...b], []);
        studentsLessons[student] = lessons;
    });

    const students: types.Students = {
        roster: roster.sort(),
        lessonsStudents: lessonsStudents,
        studentsLessons: studentsLessons
    };

    return students;
}


main();
