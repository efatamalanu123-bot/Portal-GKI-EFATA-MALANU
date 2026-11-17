export interface ClergyContact {
  id: string;
  nama: string;
  gelar: string;
  jabatan: string;
  wilayah: string;
  telepon: string;
  whatsapp: string;
  email?: string;
  jadwalPelayanan?: string;
  avatarColor: string;
  roleTag: 'Pendeta' | 'Penatua' | 'Diaken';
}

export interface GoogleContactItem {
  resourceName: string;
  displayName: string;
  phoneNumbers: string[];
  emailAddresses: string[];
  organization?: string;
  jobTitle?: string;
}

export const CLERGY_CONTACTS: ClergyContact[] = [
  {
    id: 'pdt-mayor',
    nama: 'Pdt. M. Mayor',
    gelar: 'S.Th',
    jabatan: 'Ketua Majelis Jemaat & Pendeta Jemaat',
    wilayah: 'Penggembalaan Umum & Rayon 1 - 2',
    telepon: '0812-4800-1956',
    whatsapp: '6281248001956',
    email: 'pdt.mayor@gkiefatamalanu.org',
    jadwalPelayanan: 'Selasa & Kamis sore (16:30 – 18:30 WIT) / Khusus Sakit RS Standby',
    avatarColor: 'from-[#9A3412] to-[#7C2D12]',
    roleTag: 'Pendeta',
  },
  {
    id: 'pdt-rumaropen',
    nama: 'Pdt. J. Rumaropen',
    gelar: 'M.Teol',
    jabatan: 'Pelayan Firman & Pendeta Jemaat',
    wilayah: 'Penggembalaan Umum & Rayon 3, 4, 5',
    telepon: '0813-4455-8822',
    whatsapp: '6281344558822',
    email: 'pdt.rumaropen@gkiefatamalanu.org',
    jadwalPelayanan: 'Rabu & Jumat sore (16:30 – 18:30 WIT) / Konseling Keluarga',
    avatarColor: 'from-[#7C2D12] to-[#B45309]',
    roleTag: 'Pendeta',
  },
  {
    id: 'pnt-kambuaya',
    nama: 'Pnt. Markus Kambuaya',
    gelar: 'S.Sos',
    jabatan: 'Penatua Koordinator Rayon 1',
    wilayah: 'Rayon 1 (Malanu Kampung)',
    telepon: '0821-9988-1122',
    whatsapp: '6282199881122',
    email: 'markus.kambuaya@gkiefatamalanu.org',
    jadwalPelayanan: 'Kunjungan rutin Rayon 1 tiap Selasa malam & panggilan darurat',
    avatarColor: 'from-[#B45309] to-[#D97706]',
    roleTag: 'Penatua',
  },
  {
    id: 'pnt-mandowen',
    nama: 'Pnt. Sarah Mandowen',
    gelar: 'S.Pd',
    jabatan: 'Penatua Koordinator Rayon 2',
    wilayah: 'Rayon 2 (Kompleks Gereja Efata)',
    telepon: '0812-4011-3344',
    whatsapp: '6281240113344',
    email: 'sarah.mandowen@gkiefatamalanu.org',
    jadwalPelayanan: 'Kunjungan keluarga Rayon 2 tiap Rabu sore & pendampingan PW',
    avatarColor: 'from-[#D97706] to-[#CA8A04]',
    roleTag: 'Penatua',
  },
  {
    id: 'pnt-paiki',
    nama: 'Pnt. Decky Paiki',
    gelar: 'S.T',
    jabatan: 'Penatua Koordinator Rayon 3',
    wilayah: 'Rayon 3 (BTN / KPR Malanu)',
    telepon: '0852-4433-2211',
    whatsapp: '6285244332211',
    jadwalPelayanan: 'Kunjungan keluarga Rayon 3 tiap Kamis malam & PKB',
    avatarColor: 'from-[#9A3412] to-[#C2410C]',
    roleTag: 'Penatua',
  },
  {
    id: 'pnt-osok',
    nama: 'Pnt. Martha Osok',
    gelar: 'S.Th',
    jabatan: 'Penatua Koordinator Rayon 4',
    wilayah: 'Rayon 4 (Malanu Atas / Bukit Baru)',
    telepon: '0813-5566-7788',
    whatsapp: '6281355667788',
    jadwalPelayanan: 'Kunjungan doa & lansia Rayon 4 tiap Jumat sore',
    avatarColor: 'from-[#B45309] to-[#9A3412]',
    roleTag: 'Penatua',
  },
  {
    id: 'pnt-wabiser',
    nama: 'Pnt. Yohanis Wabiser',
    gelar: 'S.E',
    jabatan: 'Penatua Koordinator Rayon 5',
    wilayah: 'Rayon 5 (Tanjung Batu / Rufei)',
    telepon: '0822-3344-5566',
    whatsapp: '6282233445566',
    jadwalPelayanan: 'Kunjungan keluarga Rayon 5 & pemuda PAM',
    avatarColor: 'from-[#7C2D12] to-[#431407]',
    roleTag: 'Penatua',
  },
  {
    id: 'dkn-mayor',
    nama: 'Dkn. Elizabeth Mayor',
    gelar: 'A.Md.Keb',
    jabatan: 'Urusan Diakonia & Kunjungan Kasih',
    wilayah: 'Seluruh Wilayah Jemaat (Khusus Sakit RS & Duka)',
    telepon: '0812-3322-1144',
    whatsapp: '6281233221144',
    jadwalPelayanan: 'Siaga kunjungan Rumah Sakit, doa orang sakit, & bantuan diakonia',
    avatarColor: 'from-[#C2410C] to-[#EA580C]',
    roleTag: 'Diaken',
  },
];

/**
 * Fetches connections from Google People API (Contacts).
 */
export async function fetchGoogleContacts(accessToken: string): Promise<GoogleContactItem[]> {
  const url =
    'https://people.googleapis.com/v1/people/me/connections?' +
    new URLSearchParams({
      personFields: 'names,phoneNumbers,emailAddresses,organizations',
      pageSize: '100',
      sortOrder: 'FIRST_NAME_ASCENDING',
    }).toString();

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal membaca Google Contacts (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const connections = Array.isArray(data.connections) ? data.connections : [];

  return connections.map((c: any) => {
    const primaryName =
      c.names?.find((n: any) => n.metadata?.primary) || c.names?.[0];
    const phones = (c.phoneNumbers || []).map((p: any) => p.value || '').filter(Boolean);
    const emails = (c.emailAddresses || []).map((e: any) => e.value || '').filter(Boolean);
    const org = c.organizations?.[0]?.name || '';
    const title = c.organizations?.[0]?.title || '';

    return {
      resourceName: c.resourceName || '',
      displayName: primaryName?.displayName || primaryName?.givenName || 'Tanpa Nama',
      phoneNumbers: phones,
      emailAddresses: emails,
      organization: org,
      jobTitle: title,
    };
  });
}

/**
 * Builds standard vCard (.vcf) formatted text for an individual clergy contact.
 */
export function buildVCard(contact: ClergyContact): string {
  const cleanPhone = contact.telepon.replace(/\D/g, '');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.nama}, ${contact.gelar} (${contact.roleTag} GKI Efata)`,
    `N:${contact.nama};;;;`,
    `TITLE:${contact.jabatan}`,
    `ORG:GKI Efata Malanu Klasis Sorong;${contact.wilayah}`,
    `TEL;TYPE=CELL,VOICE:${contact.telepon}`,
    `TEL;TYPE=WORK,MSG:+${contact.whatsapp}`,
    contact.email ? `EMAIL;TYPE=INTERNET,WORK:${contact.email}` : '',
    `NOTE:Pelayanan Pastoral GKI Efata Malanu · ${contact.jadwalPelayanan || ''}`,
    'ADR;TYPE=WORK:;;Jl. Basuki Rahmat Km. 9\\, Malanu;Kota Sorong;Papua Barat Daya;98416;Indonesia',
    'END:VCARD',
  ].filter(Boolean);

  return lines.join('\r\n');
}

/**
 * Triggers a browser download of a vCard file so the user can import into Google Contacts or phone address book.
 */
export function downloadVCard(contact: ClergyContact): void {
  const vcfContent = buildVCard(contact);
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${contact.nama.replace(/\s+/g, '_')}_GKI_Efata.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a bundle download of all clergy and elder vCards into one file.
 */
export function downloadAllClergyVCards(contacts = CLERGY_CONTACTS): void {
  const bundle = contacts.map(buildVCard).join('\r\n\r\n');
  const blob = new Blob([bundle], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Kontak_Majelis_Pastoral_GKI_Efata_Malanu.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
