-- Descriptions translated/condensed from each organizer's own wording (source URL kept). Organizers without an own-source description stay null.
update public.listings l set organizer_description = v.d, organizer_source_url = v.s, organizer_website = v.w
from (values
 ('Superteam Brasil','Ayuda a lanzar y hacer crecer los proyectos más prometedores del ecosistema Solana en Brasil, como comunidad de creadores, desarrolladores y operadores.','https://br.superteam.fun/','https://br.superteam.fun/'),
 ('Media Party','Donde convergen el periodismo y la tecnología: el principal centro de innovación y tecnología de medios digitales de Latinoamérica.','https://mediaparty.org/','https://mediaparty.org/'),
 ('LABITCONF','La conferencia de Bitcoin más grande de Latinoamérica.','https://labitconf.com/','https://labitconf.com/'),
 ('Mobil3','Diseña y organiza hackatones, programas universitarios y de gobierno y adopción de desarrolladores en México, conectando empresas con quienes construyen ahí.','https://mobil3.xyz/','https://mobil3.xyz/'),
 ('Twin Finance','Infraestructura financiera onchain para Latinoamérica: Twin Stablecoins y Twin Assets, para exchanges, fintechs y gestores de activos.','https://twin.finance/','https://twin.finance/'),
 ('Superteam Argentina','La casa de los builders, founders y soñadores de Solana en Argentina, impulsada por Solana y Superteam.','https://x.com/SuperteamAR','https://x.com/SuperteamAR'),
 ('Interledger Foundation','Construye infraestructura de pagos abierta, financia a innovadores y trabaja para que los sistemas financieros funcionen juntos, para todos.','https://interledger.org/','https://interledger.org/'),
 ('Instituto Nacional Electoral (INE)','Organiza procesos electorales libres, equitativos y confiables para garantizar el ejercicio de los derechos electorales.','https://ine.mx/','https://ine.mx/'),
 ('belo','Recibí dinero del exterior y usalo al instante desde donde estés, de forma simple, rápida y segura.','https://belo.app/ar','https://belo.app/ar')
) v(o,d,s,w) where l.organizer = v.o;
