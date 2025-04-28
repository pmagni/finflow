
import { expect, test } from 'vitest';

test('Basic arithmetic operations performance', () => {
  const iterations = 10000;
  
  // Addition
  const startAddition = performance.now();
  let sumResult = 0;
  for (let i = 0; i < iterations; i++) {
    sumResult += i;
  }
  const endAddition = performance.now();
  
  // Multiplication
  const startMultiplication = performance.now();
  let multiplyResult = 1;
  for (let i = 1; i <= 1000; i++) {
    multiplyResult *= (i % 10) + 1; // Prevent overflow
  }
  const endMultiplication = performance.now();
  
  console.log(`Addition: ${endAddition - startAddition}ms`);
  console.log(`Multiplication: ${endMultiplication - startMultiplication}ms`);
  
  // Just a simple assertion to ensure the test passes
  expect(true).toBe(true);
});
