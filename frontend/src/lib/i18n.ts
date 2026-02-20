import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      'login': 'Login',
      'logout': 'Logout',
      'email': 'Email',
      'password': 'Password',
      'login_button': 'Sign In',

      'dashboard': 'Dashboard',
      'guests': 'Guests',
      'events': 'Timeline',
      'rsvp': 'RSVP',
      'settings': 'Settings',

      'total_guests': 'Total Guests',
      'attending': 'Attending',
      'not_attending': 'Not Attending',
      'pending': 'Pending',
      'plus_ones': 'Plus Ones',
      'total_attending': 'Total Attending',

      'first_name': 'First Name',
      'last_name': 'Last Name',
      'phone': 'Phone',
      'group': 'Group',
      'status': 'Status',
      'actions': 'Actions',
      'search': 'Search...',
      'add_guest': 'Add Guest',
      'edit': 'Edit',
      'delete': 'Delete',
      'save': 'Save',
      'cancel': 'Cancel',
      'close': 'Close',

      'rsvp_code': 'RSVP Code',
      'plus_one': 'Plus One',
      'plus_one_name': 'Plus One Name',
      'dietary_restrictions': 'Dietary Restrictions',
      'message': 'Message',
      'table_number': 'Table Number',
      'notes': 'Admin Notes',

      'rsvp_title': 'You\'re Invited',
      'rsvp_subtitle': 'Please enter your RSVP code to respond',
      'rsvp_enter_code': 'Enter your code',
      'rsvp_lookup': 'Look Up',
      'rsvp_attending': 'Joyfully Accept',
      'rsvp_not_attending': 'Respectfully Decline',
      'rsvp_submit': 'Submit RSVP',
      'rsvp_success': 'Thank you! Your RSVP has been recorded.',
      'rsvp_message_placeholder': 'Leave a message for the couple...',

      'event_timeline': 'Event Timeline',
      'no_events': 'No events scheduled yet.',

      'confirm_delete': 'Are you sure you want to delete this?',
    },
  },
  fr: {
    translation: {
      'login': 'Connexion',
      'logout': 'Deconnexion',
      'email': 'Email',
      'password': 'Mot de passe',
      'login_button': 'Se connecter',

      'dashboard': 'Tableau de bord',
      'guests': 'Invites',
      'events': 'Programme',
      'rsvp': 'RSVP',
      'settings': 'Parametres',

      'total_guests': 'Total invites',
      'attending': 'Presents',
      'not_attending': 'Absents',
      'pending': 'En attente',
      'plus_ones': 'Accompagnants',
      'total_attending': 'Total presents',

      'first_name': 'Prenom',
      'last_name': 'Nom',
      'phone': 'Telephone',
      'group': 'Groupe',
      'status': 'Statut',
      'actions': 'Actions',
      'search': 'Rechercher...',
      'add_guest': 'Ajouter un invite',
      'edit': 'Modifier',
      'delete': 'Supprimer',
      'save': 'Enregistrer',
      'cancel': 'Annuler',
      'close': 'Fermer',

      'rsvp_code': 'Code RSVP',
      'plus_one': 'Accompagnant',
      'plus_one_name': 'Nom de l\'accompagnant',
      'dietary_restrictions': 'Restrictions alimentaires',
      'message': 'Message',
      'table_number': 'Numero de table',
      'notes': 'Notes admin',

      'rsvp_title': 'Vous etes invites',
      'rsvp_subtitle': 'Veuillez entrer votre code RSVP pour repondre',
      'rsvp_enter_code': 'Entrez votre code',
      'rsvp_lookup': 'Rechercher',
      'rsvp_attending': 'Accepte avec joie',
      'rsvp_not_attending': 'Decline respectueusement',
      'rsvp_submit': 'Envoyer le RSVP',
      'rsvp_success': 'Merci ! Votre RSVP a ete enregistre.',
      'rsvp_message_placeholder': 'Laissez un message aux maries...',

      'event_timeline': 'Programme de la journee',
      'no_events': 'Aucun evenement programme.',

      'confirm_delete': 'Etes-vous sur de vouloir supprimer ceci ?',
    },
  },
  ar: {
    translation: {
      'login': 'تسجيل الدخول',
      'logout': 'تسجيل الخروج',
      'email': 'البريد الإلكتروني',
      'password': 'كلمة المرور',
      'login_button': 'دخول',

      'dashboard': 'لوحة التحكم',
      'guests': 'المدعوون',
      'events': 'البرنامج',
      'rsvp': 'تأكيد الحضور',
      'settings': 'الإعدادات',

      'total_guests': 'إجمالي المدعوين',
      'attending': 'حاضرون',
      'not_attending': 'غائبون',
      'pending': 'في الانتظار',
      'plus_ones': 'مرافقون',
      'total_attending': 'إجمالي الحاضرين',

      'first_name': 'الاسم الأول',
      'last_name': 'اسم العائلة',
      'phone': 'الهاتف',
      'group': 'المجموعة',
      'status': 'الحالة',
      'actions': 'إجراءات',
      'search': 'بحث...',
      'add_guest': 'إضافة مدعو',
      'edit': 'تعديل',
      'delete': 'حذف',
      'save': 'حفظ',
      'cancel': 'إلغاء',
      'close': 'إغلاق',

      'rsvp_code': 'رمز الدعوة',
      'plus_one': 'مرافق',
      'plus_one_name': 'اسم المرافق',
      'dietary_restrictions': 'قيود غذائية',
      'message': 'رسالة',
      'table_number': 'رقم الطاولة',
      'notes': 'ملاحظات',

      'rsvp_title': 'أنتم مدعوون',
      'rsvp_subtitle': 'أدخل رمز الدعوة للرد',
      'rsvp_enter_code': 'أدخل الرمز',
      'rsvp_lookup': 'بحث',
      'rsvp_attending': 'نقبل بكل سرور',
      'rsvp_not_attending': 'نعتذر باحترام',
      'rsvp_submit': 'إرسال الرد',
      'rsvp_success': 'شكرا لكم! تم تسجيل ردكم.',
      'rsvp_message_placeholder': 'اترك رسالة للعروسين...',

      'event_timeline': 'برنامج الحفل',
      'no_events': 'لا يوجد برنامج بعد.',

      'confirm_delete': 'هل أنت متأكد من الحذف؟',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
