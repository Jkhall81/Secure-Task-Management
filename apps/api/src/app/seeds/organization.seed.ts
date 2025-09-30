import { DataSource } from 'typeorm';
import { Organization } from '../entities/organization.entity';

export async function seedOrganizations(dataSource: DataSource) {
  const orgRepo = dataSource.getRepository(Organization);

  // Check if an organization with id 1 exists
  const existingOrg = await orgRepo.findOne({ where: { id: 1 } });
  if (existingOrg) {
    console.log('Organization already exists!');
    return;
  }

  // Create a new organization
  const org = orgRepo.create({
    name: 'Example Organization',
    // Optionally, you can add a parentId or other fields
  });

  await orgRepo.save(org);
  console.log('Organization seeded:', org);
}
