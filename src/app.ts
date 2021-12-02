import { Man, Woman } from './models/human';
import { DbUtils } from './lib/db';
import { World } from './models/world';


const buildWorld = async () => {

    const db = new DbUtils();
    await db.bootstrap();
    const world = new World(db)

    for (let i = 0; i < 150; i++) {

        await world.tick(1);
    }
    await world.summary();
}


buildWorld();



