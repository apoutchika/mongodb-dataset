const Promise = require("bluebird");
const MongoClient = require("mongodb").MongoClient;

const Chance = require("chance");

const random = require("lodash/random");
const sampleSize = require("lodash/sampleSize");

const turf = require("@turf/turf");
const franceMap = require("./custom.geo.json");
const randomPointsInPolygon = require("random-points-on-polygon");

const logUpdate = require("log-update");
const log = logUpdate.create(process.stdout, {
  showCursor: true,
});

/**
 * Config
 */
const TOTAL = 2_000_000;

const url = "mongodb://localhost:27017";
const dbName = "dataset";

const tags = [
  "PHP",
  "Javascript",
  "Ruby",
  "Symfony",
  "Laravel",
  "ExpressJS",
  "NestJS",
  "NextJS",
  "Python",
  "VueJS",
  "Angular",
  "React",
  "MySQL",
  "Redis",
  "MongoDB",
  "IoT",
  "HTML",
  "CSS",
  "SCSS",
  "WordPress",
  "Arduino",
  "Java",
  "C",
  "C++",
  "C#",
  ".NET",
];

const getArray = (nb) => new Array(nb).fill();
const chance = new Chance();
const poly = turf.multiPolygon(franceMap.features[0].geometry.coordinates);

const getAddress = () => {
  const [location] = randomPointsInPolygon(1, poly);
  return {
    street: chance.address(),
    zip: chance.postcode(),
    country: chance.country({ full: true }),
    location: { type: "Point", coordinates: location },
  };
};

MongoClient.connect(url, async function (err, client) {
  if (err) {
    console.error(err);
  }
  const db = client.db(dbName);
  const User = db.collection("users");

  await Promise.each(getArray(TOTAL), (_el, key) => {
    const id = key + 1;
    const pc = Math.round((key * 100) / TOTAL);

    log(`${id}/${TOTAL} - ${pc}%`);
    const addresses = getArray(random(1, 4)).map(getAddress);

    const items = getArray(random(0, 10)).map(() => random(0, 2000));

    return User.insertOne({
      firstName: chance.first(),
      lastName: chance.last(),
      email: chance.email(),
      basket: {
        items,
        nbItems: items.length,
        amount: items.reduce((acc, amount) => acc + amount, 0),
      },
      addresses,
      experiences: sampleSize(tags, random(1, 10)),
      birthDay: new Date(chance.birthday()),
    });
  });

  console.log(`

- Fini.

Archive :
❯ mongodump --host localhost --db ${dbName} --gzip --archive=${dbName}.archive

Restore :
❯ mongorestore --gzip --archive=${dbName}.archive
`);
  console.log("OK");
  process.exit();
});
