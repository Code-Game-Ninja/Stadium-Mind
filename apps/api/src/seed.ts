import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load the environment variables from the correct path (.env is in apps/api/.env or root?)
dotenv.config({ path: resolve(__dirname, '../../.env') }); // Try root first
dotenv.config({ path: resolve(__dirname, '../.env') }); // Try api/ next

// Set the variable explicitly if it's there
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(__dirname, '../stadium-f6e21-firebase-adminsdk.json');
}

import { db, auth } from './firebase';
import { getMatchState } from './store';
import { STADIUMS, MATCHES, TICKETS, DEMO_CREDENTIALS, DEMO_TICKET_IDS } from '@stadiummind/shared';

async function clearCollection(collectionName: string) {
  const snap = await db.collection(collectionName).get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  if (!snap.empty) await batch.commit();
}

async function seed() {
  console.log('Starting seed process...');
  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS not set!');
    process.exit(1);
  }

  // 1. Delete existing match documents and their subcollections
  const matchesSnap = await db.collection('matches').get();
  for (const matchDoc of matchesSnap.docs) {
    console.log(`Deleting existing data for match: ${matchDoc.id}`);
    
    // Delete subcollections first
    const subcollections = ['zones', 'incidents', 'timeline', 'merchandise', 'volunteers', 'recommendations', 'actionHistory'];
    for (const sub of subcollections) {
      const subSnap = await db.collection('matches').doc(matchDoc.id).collection(sub).get();
      const batch = db.batch();
      subSnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      if (!subSnap.empty) {
        await batch.commit();
      }
    }
    
    // Delete main doc
    await db.collection('matches').doc(matchDoc.id).delete();
  }

  console.log('Cleared existing matches.');
  await clearCollection('stadiums');
  await clearCollection('tickets');
  await clearCollection('config');


  async function ensureUser(email: string, password: string, displayName: string, role: string) {
    let uid: string;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      await auth.updateUser(uid, { password, displayName });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const userRecord = await auth.createUser({ email, password, displayName });
        uid = userRecord.uid;
      } else {
        throw e;
      }
    }
    // Also save their role and details in the `users` collection for Firestore rules and frontend reads
    await db.collection('users').doc(uid).set({
      email,
      displayName,
      role
    }, { merge: true });
    console.log(`Ensured user ${email} with role ${role}`);
  }

  await ensureUser(DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password, 'Operations Lead', 'admin');
  await ensureUser(DEMO_CREDENTIALS.volunteer.email, DEMO_CREDENTIALS.volunteer.password, 'Zone Volunteer', 'volunteer');
  await ensureUser(DEMO_CREDENTIALS.fan.email, DEMO_CREDENTIALS.fan.password, 'Demo Fan', 'fan');

  console.log('Seeding root collections (stadiums, matches_meta, tickets, config)...');
  
  const b1 = db.batch();
  for (const s of STADIUMS) b1.set(db.collection('stadiums').doc(s.id), s);
  for (const m of MATCHES) b1.set(db.collection('matches_meta').doc(m.id), m);
  for (const t of TICKETS) b1.set(db.collection('tickets').doc(t.ticketId), t);
  b1.set(db.collection('config').doc('demo'), {
    // Demo credentials intentionally NOT stored here — never serve passwords.
    ticketIds: DEMO_TICKET_IDS
  });
  await b1.commit();

  // 2. Re-seed by triggering getMatchState for all static matches
  // getMatches uses staticMatches internally until we update it, but here we can just use the MATCHES array
  for (const match of MATCHES) {
    console.log(`Seeding match subcollections: ${match.id} (${match.homeTeam} vs ${match.awayTeam})`);
    // getMatchState calls ensureFirebaseSeeded internally if the doc doesn't exist.
    await getMatchState(match.id);
  }

  console.log('Seed process completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed process failed:', err);
  process.exit(1);
});
