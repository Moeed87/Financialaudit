
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');
    
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      return existingUser;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('johndoe123', 12);
    
    // Create the test user
    const testUser = await prisma.user.create({
      data: {
        email: 'john@doe.com',
        name: 'John Doe',
        password: hashedPassword
      }
    });
    
    console.log('✅ Test user created successfully:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name
    });
    
    return testUser;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
