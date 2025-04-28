
// This file is manually testing performance without using an actual test framework
// This avoids the dependency on vitest

// Simple performance test for basic operations
const performanceTest = () => {
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
  
  return true;
};

// Run the performance test
performanceTest();
