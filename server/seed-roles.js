import prisma from './config/prisma.js'

async function seedRoles() {
  console.log(' Seeding roles...')

  try {
    // Create roles
    const patientRole = await prisma.role.upsert({
      where: { title: 'Patient' },
      update: {},
      create: {
        title: 'Patient',
        scopes: { read: true, write: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    const doctorRole = await prisma.role.upsert({
      where: { title: 'Doctor' },
      update: {},
      create: {
        title: 'Doctor',
        scopes: { read: true, write: true, manage: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    const staffRole = await prisma.role.upsert({
      where: { title: 'Staff' },
      update: {},
      create: {
        title: 'Staff',
        scopes: { read: true, write: true, manage: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log(' Roles created successfully!')
    console.log(`   - Patient Role: ${patientRole.id}`)
    console.log(`   - Doctor Role: ${doctorRole.id}`)
    console.log(`   - Staff Role: ${staffRole.id}`)
  } catch (error) {
    console.error(' Error seeding roles:', error)
    throw error
  }
}

seedRoles()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
