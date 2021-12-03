import { Man, Woman } from './models/human';
import { DbUtils } from './lib/db';
import { World } from './models/world';


const buildWorld = async () => {

    console.time = ()=>{};
    console.timeEnd= ()=>{};

    const db = new DbUtils();
    await db.bootstrap();
    const world = new World(db)

    for (let i = 0; i < 2400; i++) {
        await world.tick(1);
        if (i % 120 == 0) {

            console.log(`${i / 12} Years passed:`);
            await world.summary();
            console.log('--------------------')
        }
    }
    await world.summary();

}


buildWorld();



