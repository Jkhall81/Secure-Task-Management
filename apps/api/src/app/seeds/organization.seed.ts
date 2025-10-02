// import { DataSource } from 'typeorm';
// import { Organization } from '../entities/organization.entity';

// export async function seedOrganizations(dataSource: DataSource) {
//   const orgRepo = dataSource.getRepository(Organization);

//   // Check if ANY organizations exist
//   const existingOrgs = await orgRepo.find();

//   // Only seed if NO organizations exist at all
//   if (existingOrgs.length > 0) {
//     console.log('Organizations already exist, skipping seed.');
//     return;
//   }

//   // Create example organization
//   const org = orgRepo.create({
//     name: 'Example Organization',
//   });

//   await orgRepo.save(org);
//   console.log('Example organization seeded:', org);
// }
