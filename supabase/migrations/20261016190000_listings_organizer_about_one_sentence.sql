-- One short sentence about what each organizer does (not the event), faithful to its own source.
update public.listings l set organizer_description = v.d
from (values
 ('belo','belo es una billetera virtual internacional para recibir pagos del exterior y usarlos al instante, estés donde estés.'),
 ('Superteam Brasil','Superteam Brasil es una comunidad de creadores, desarrolladores y operadores que ayuda a lanzar y hacer crecer proyectos de Solana en Brasil.'),
 ('Media Party','Media Party es un centro de innovación y tecnología de medios digitales de Latinoamérica donde convergen el periodismo y la tecnología.'),
 ('LABITCONF','LABITCONF es la conferencia de Bitcoin más grande de Latinoamérica.'),
 ('Mobil3','Mobil3 diseña y organiza hackatones y programas para desarrolladores en México, conectando empresas con quienes construyen ahí.'),
 ('Twin Finance','Twin es una infraestructura financiera onchain para Latinoamérica, con stablecoins y activos para exchanges, fintechs y gestores de activos.'),
 ('Superteam Argentina','Superteam Argentina es la comunidad de builders y founders de Solana en Argentina, impulsada por Solana y Superteam.'),
 ('Interledger Foundation','Interledger Foundation construye infraestructura de pagos abierta y financia a innovadores para que los sistemas financieros funcionen juntos.'),
 ('Instituto Nacional Electoral (INE)','El Instituto Nacional Electoral organiza procesos electorales libres, equitativos y confiables.')
) v(o,d) where l.organizer = v.o;
