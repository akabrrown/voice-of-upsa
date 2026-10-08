import test from 'node:test';
import assert from 'node:assert/strict';
import { screenConfession, isPriorityFlag } from './screening.ts';

test('ordinary posts pass with no flag', () => {
  const clean = [
    'I still have no idea what my lecturer meant by "synergy" in week three.',
    'The new cafeteria jollof is honestly better than my mum\'s. Do not tell her.',
    'Opinion: the library should stay open until midnight during exam season.',
    'I came to UPSA because of my friends and stayed because of the Accounting Society.',
  ];
  for (const text of clean) {
    assert.equal(screenConfession(text).flag, 'none', `false positive on: ${text}`);
  }
});

test('self-harm language is flagged and treated as priority', () => {
  const samples = [
    'Some nights I just want to kill myself after results come out.',
    'I have been thinking about ending my life lately.',
    'honestly i dont want to be alive anymore',
    'I keep cutting myself and nobody knows',
  ];
  for (const text of samples) {
    const result = screenConfession(text);
    assert.equal(result.flag, 'self_harm', `missed self-harm in: ${text}`);
    assert.equal(isPriorityFlag(result.flag), true);
  }
});

test('threats of violence are flagged and treated as priority', () => {
  const samples = [
    'I am going to shoot everyone in the lecture hall on Monday.',
    'Next time he talks to me I will kill him.',
    'Someone should bomb the admin block.',
  ];
  for (const text of samples) {
    const result = screenConfession(text);
    assert.equal(result.flag, 'threat', `missed threat in: ${text}`);
    assert.equal(isPriorityFlag(result.flag), true);
  }
});

test('contact details are flagged', () => {
  const samples = [
    'Call me on 024 123 4567 if you want the past questions.',
    'DM me on IG @campus.secret.gh',
    'email me at someone@gmail.com',
    'whatsapp +233 50 123 4567',
  ];
  for (const text of samples) {
    assert.equal(screenConfession(text).flag, 'contact_info', `missed contact info in: ${text}`);
  }
});

test('hate speech is flagged', () => {
  assert.equal(screenConfession('All those tribalistic people should go back to their village, they are animals.').flag, 'hate_speech');
});

test('name-like sequences are flagged but common campus phrases are not', () => {
  assert.equal(screenConfession('Kwame Mensah from level 300 cheated in the mid-sem.').flag, 'name_pattern');
  assert.equal(screenConfession('Student Representative Council elections are a joke this year.').flag, 'none');
  assert.equal(screenConfession('The University Library and Main Auditorium need AC.').flag, 'none');
});

test('self-harm takes precedence over other flags', () => {
  const result = screenConfession('Kwame Mensah, I want to kill myself because of you.');
  assert.equal(result.flag, 'self_harm');
});

test('non-priority flags are not priority', () => {
  assert.equal(isPriorityFlag('contact_info'), false);
  assert.equal(isPriorityFlag('name_pattern'), false);
  assert.equal(isPriorityFlag('none'), false);
});
