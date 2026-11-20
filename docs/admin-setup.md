# Platform administrator setup

The administrator area currently supports doctor verification. It is not a general patient-record viewer. Credential numbers are stored in a separate RLS-protected table and exposed only to the submitting clinician and `platform_admin` users. Review decisions require a server-side role check and are recorded in `audit_logs`.

No platform administrator is assigned in the linked project yet. A project owner must designate the initial administrator through the Supabase SQL editor or another trusted database session. First find the intended, email-confirmed account:

```sql
select id, email
from auth.users
where lower(email) = lower('admin@example.com')
  and email_confirmed_at is not null;
```

After confirming that the returned account is the intended operator, grant the role using that account UUID:

```sql
insert into public.user_roles (user_id, role)
values ('CONFIRMED-ACCOUNT-UUID', 'platform_admin')
on conflict (user_id, role) do nothing;
```

Ordinary users cannot add roles or grant themselves administrator access. Do not expose a service-role key in the application. To remove the role, delete only the matching `platform_admin` row from `public.user_roles` using a trusted database session. The application intentionally does not assign the first administrator automatically.

Doctor registration information is a submitted claim. Administrators must verify it with the issuing council or another trusted source outside MedVita. The current workflow has no registry integration and must not be described as automated credential verification.
