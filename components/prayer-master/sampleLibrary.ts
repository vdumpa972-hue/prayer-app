import { Tradition } from './types';

export const SAMPLE_LIBRARY: Tradition[] = [
  {
    id: 'jewish_prayer_books',
    title: 'Jewish Prayer Books',
    books: [
      {
        id: 'daily_morning',
        title: 'Daily Morning Prayers',
        prayers: [
          {
            id: 'modeh_ani',
            title: 'Modeh Ani',
            language: 'he',
            originalText: 'מודה אני לפניך מלך חי וקיים שהחזרת בי נשמתי בחמלה רבה אמונתך',
            translationEnglish: 'I thank You, living and enduring King, for returning my soul within me with compassion; abundant is Your faithfulness.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
          {
            id: 'asher_yatzar',
            title: 'Asher Yatzar',
            language: 'he',
            originalText: 'ברוך אתה יהוה אלהינו מלך העולם אשר יצר את האדם בחכמה וברא בו נקבים נקבים חלולים חלולים',
            translationEnglish: 'Blessed are You, Lord our God, King of the universe, who formed man with wisdom and created within him many openings and cavities.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
          {
            id: 'shema',
            title: 'Shema',
            language: 'he',
            originalText: 'שמע ישראל יהוה אלהינו יהוה אחד ברוך שם כבוד מלכותו לעולם ועד',
            translationEnglish: 'Hear, O Israel: the Lord is our God, the Lord is One. Blessed be the name of His glorious kingdom forever and ever.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
          {
            id: 'v_ahavta',
            title: 'VeAhavta',
            language: 'he',
            originalText: 'ואהבת את יהוה אלהיך בכל לבבך ובכל נפשך ובכל מאדך והיו הדברים האלה אשר אנכי מצוך היום על לבבך',
            translationEnglish: 'And you shall love the Lord your God with all your heart, with all your soul, and with all your might.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
        ],
      },
      {
        id: 'shabbat_prayers',
        title: 'Shabbat Prayers',
        prayers: [
          {
            id: 'shalom_aleichem',
            title: 'Shalom Aleichem',
            language: 'he',
            originalText: 'שלום עליכם מלאכי השרת מלאכי עליון ממלך מלכי המלכים הקדוש ברוך הוא',
            translationEnglish: 'Peace unto you, ministering angels, angels of the Most High.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
          {
            id: 'kiddush',
            title: 'Kiddush',
            language: 'he',
            originalText: 'יום הששי ויכלו השמים והארץ וכל צבאם ויכל אלהים ביום השביעי מלאכתו אשר עשה',
            translationEnglish: 'And the heavens and the earth were finished, and all their array.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
        ],
      },
    ],
  },
  {
    id: 'catholic_prayers',
    title: 'Catholic Prayers',
    books: [
      {
        id: 'basic_prayers',
        title: 'Basic Prayers',
        prayers: [
          {
            id: 'our_father',
            title: 'Our Father',
            language: 'en',
            originalText: 'Our Father who art in heaven hallowed be thy name thy kingdom come thy will be done on earth as it is in heaven',
            translationEnglish: "Traditional English prayer of the Lord's Prayer.",
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
          {
            id: 'hail_mary',
            title: 'Hail Mary',
            language: 'en',
            originalText: 'Hail Mary full of grace the Lord is with thee blessed art thou among women and blessed is the fruit of thy womb Jesus',
            translationEnglish: 'Traditional opening section of the Hail Mary prayer.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
        ],
      },
    ],
  },
  {
    id: 'christian_prayers',
    title: 'Christian Prayers',
    books: [
      {
        id: 'general_christian',
        title: 'General Christian Prayers',
        prayers: [
          {
            id: 'lords_prayer',
            title: "Lord's Prayer",
            language: 'en',
            originalText: 'Our Father in heaven hallowed be your name your kingdom come your will be done on earth as it is in heaven',
            translationEnglish: "Common Christian form of the Lord's Prayer.",
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
          {
            id: 'jesus_prayer',
            title: 'Jesus Prayer',
            language: 'en',
            originalText: 'Lord Jesus Christ Son of God have mercy on me a sinner',
            translationEnglish: 'Traditional short prayer in Eastern Christianity.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
        ],
      },
    ],
  },
  {
    id: 'quran_seed',
    title: 'Quran',
    books: [
      {
        id: 'opening_and_short_surahs',
        title: 'Opening and Short Surahs',
        prayers: [
          {
            id: 'surah_al_fatiha',
            title: 'Surah Al-Fatiha',
            language: 'ar',
            originalText: 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين إياك نعبد وإياك نستعين',
            translationEnglish: 'In the name of Allah, the Entirely Merciful, the Especially Merciful. All praise is due to Allah, Lord of the worlds.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
          {
            id: 'surah_al_ikhlas',
            title: 'Surah Al-Ikhlas',
            language: 'ar',
            originalText: 'قل هو الله أحد الله الصمد لم يلد ولم يولد ولم يكن له كفوا أحد',
            translationEnglish: 'Say: He is Allah, One. Allah, the Eternal Refuge.',
            sourceType: 'seed',
            sourceName: 'Sample Library',
          },
        ],
      },
    ],
  },
];
