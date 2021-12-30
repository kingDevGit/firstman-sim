import { DbUtils } from './lib/db';
import { World } from './models/world';
import { plot, Plot } from 'nodeplotlib';


const buildWorld = async () => {

    let aggeTimes = [];
    let aggePopu = [];

    const timeStart = console.time;
    const timeEnd = console.timeEnd;

    console.time = ()=>{};
    console.timeEnd= ()=>{};

    const db = new DbUtils();
    await db.bootstrap();
    const world = new World(db)

    for (let i = 0; i < 1200; i++) {
        await world.tick(1);
        if (i % 120 == 0) {

            console.log(`${i / 12} Years passed:`);
           const summary =  await world.summary();
           aggeTimes.push(summary.yearPassed)

        //    if(summary.yearPassed>=170){
        //        console.time = timeStart;
        //        console.timeEnd=timeEnd;
        //    }


           aggePopu.push(summary.population)
            console.log('--------------------')
        }
    }
    const summary = await world.summary();

    aggeTimes.push(summary.yearPassed)
    aggePopu.push(summary.population)

    await world.totalSummary();
    

    const data: Plot[] = [{x: aggeTimes, y: aggePopu, type: 'scatter'}];
    plot(data);
}



buildWorld();



