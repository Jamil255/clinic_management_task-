import prisma from './config/prisma.js'

/**
 * Script to list all doctors in the system
 */

async function listDoctors() {
  try {
    console.log('👨‍⚕️ Listing all doctors in the system...\n')

    const doctors = await prisma.user.findMany({
      where: {
        role: {
          title: 'Doctor',
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        specialization: true,
        _count: {
          select: {
            AppointmentsAsDoctor: true,
            CaseRecordsAsDoctor: true,
          },
        },
      },
    })

    console.log(`📋 Total doctors: ${doctors.length}\n`)

    for (const doctor of doctors) {
      console.log(`Doctor: ${doctor.username}`)
      console.log(`  ID: ${doctor.id}`)
      console.log(`  Email: ${doctor.email}`)
      console.log(
        `  Specialization: ${doctor.specialization || 'Not specified'}`
      )
      console.log(`  Appointments: ${doctor._count.AppointmentsAsDoctor}`)
      console.log(`  Case Records: ${doctor._count.CaseRecordsAsDoctor}`)
      console.log()
    }

    // Check if "Doctor John" exists
    const doctorJohn = doctors.find((d) =>
      d.username.toLowerCase().includes('john')
    )
    if (doctorJohn) {
      console.log('✅ Found "Doctor John" in the system')
      console.log(`   Username: ${doctorJohn.username}`)
      console.log(`   ID: ${doctorJohn.id}`)
    } else {
      console.log('❌ No doctor with "John" in username found')
      console.log(
        '   Available doctors:',
        doctors.map((d) => d.username).join(', ')
      )
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listDoctors()
