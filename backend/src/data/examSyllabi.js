// Pre-stored official exam syllabi
// These are trusted sources and should not be modified by AI

export const examSyllabi = {
  'JEE_MAIN_PHYSICS': `SECTION A: Physics and Measurement
- Units and dimensions
- Dimensional analysis
- Least count, significant figures
- Methods of measurement and error analysis

SECTION B: Kinematics
- Frame of reference
- Motion in a straight line
- Motion in a plane
- Projectile motion
- Uniform circular motion

SECTION C: Laws of Motion
- Force and inertia
- Newton's laws of motion
- Linear momentum
- Impulse
- Conservation of momentum

SECTION D: Work, Energy and Power
- Work done by constant and variable forces
- Kinetic energy, potential energy
- Work-energy theorem
- Conservation of energy
- Power

SECTION E: Rotational Motion
- Centre of mass of a two-particle system
- Moment of inertia
- Parallel and perpendicular axes theorems
- Kinematics of rotational motion
- Angular momentum and its conservation`,

  'JEE_MAIN_CHEMISTRY': `SECTION A: Physical Chemistry
- Atomic structure
- Chemical bonding and molecular structure
- Gaseous and liquid states
- Thermodynamics
- Chemical equilibrium

SECTION B: Inorganic Chemistry
- Classification of elements and periodicity
- General principles of extraction of metals
- Hydrogen
- s-Block elements
- p-Block elements

SECTION C: Organic Chemistry
- Purification and characterization
- Hydrocarbons
- Organic compounds containing halogens
- Organic compounds containing oxygen
- Polymers`,

  'JEE_MAIN_MATHEMATICS': `SECTION A: Algebra
- Complex numbers and quadratic equations
- Matrices and determinants
- Permutations and combinations
- Binomial theorem
- Sequences and series

SECTION B: Calculus
- Differential calculus
- Integral calculus
- Differential equations
- Application of derivatives
- Application of integrals

SECTION C: Coordinate Geometry
- Straight lines
- Circles
- Parabola
- Ellipse
- Hyperbola

SECTION D: Trigonometry
- Trigonometric functions
- Inverse trigonometric functions
- Trigonometric equations
- Heights and distances

SECTION E: Vectors and 3D Geometry
- Vectors
- Three dimensional geometry`,

  'GATE_CS': `SECTION 1: Engineering Mathematics
- Linear Algebra
- Calculus
- Probability and Statistics
- Discrete Mathematics

SECTION 2: Digital Logic
- Boolean algebra
- Combinational circuits
- Sequential circuits
- Minimization techniques

SECTION 3: Computer Organization
- Machine instructions
- Addressing modes
- Memory hierarchy
- I/O interface
- Pipelining

SECTION 4: Programming and Data Structures
- Programming in C
- Functions, Recursion
- Arrays, Stacks, Queues
- Linked Lists, Trees
- Binary search trees, Graphs

SECTION 5: Algorithms
- Analysis, Asymptotic notation
- Searching, Sorting
- Hashing
- Graph algorithms
- Dynamic programming

SECTION 6: Theory of Computation
- Regular languages
- Context-free languages
- Turing machines
- Undecidability

SECTION 7: Compiler Design
- Lexical analysis
- Parsing
- Syntax directed translation
- Runtime environments
- Code generation

SECTION 8: Operating System
- Processes, Threads
- CPU scheduling
- Synchronization
- Deadlock
- Memory management
- File systems

SECTION 9: Databases
- ER model
- Relational model
- SQL
- Normalization
- Transactions
- Concurrency control

SECTION 10: Computer Networks
- ISO/OSI stack
- LAN technologies
- Flow and error control
- Routing algorithms
- TCP/UDP, IP
- Application layer protocols`,

  'OLYMPIAD_MATH': `SECTION 1: Number Theory
- Divisibility and primes
- Modular arithmetic
- Diophantine equations
- Number-theoretic functions

SECTION 2: Algebra
- Polynomials
- Functional equations
- Inequalities
- Complex numbers

SECTION 3: Combinatorics
- Counting principles
- Pigeonhole principle
- Recurrence relations
- Graph theory basics

SECTION 4: Geometry
- Triangles and circles
- Coordinate geometry
- Transformations
- Advanced theorems`
};

/**
 * Get exam syllabus by type and subject
 * @param {string} examType - Type of exam (JEE_MAIN, GATE, OLYMPIAD)
 * @param {string} subject - Subject (PHYSICS, CHEMISTRY, MATHEMATICS, CS)
 * @returns {string|null} Syllabus text or null if not found
 */
export function getExamSyllabus(examType, subject) {
  const key = `${examType}_${subject}`;
  return examSyllabi[key] || null;
}

/**
 * List all available exam syllabi
 * @returns {Array<Object>} List of available exam types and subjects
 */
export function listAvailableExams() {
  return [
    { examType: 'JEE_MAIN', subject: 'PHYSICS', label: 'JEE Main - Physics' },
    { examType: 'JEE_MAIN', subject: 'CHEMISTRY', label: 'JEE Main - Chemistry' },
    { examType: 'JEE_MAIN', subject: 'MATHEMATICS', label: 'JEE Main - Mathematics' },
    { examType: 'GATE', subject: 'CS', label: 'GATE - Computer Science' },
    { examType: 'OLYMPIAD', subject: 'MATH', label: 'Mathematical Olympiad' }
  ];
}
