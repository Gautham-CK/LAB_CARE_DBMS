# LabCare REST API  (base URL http://localhost:5000)

Every table has the 5 standard CRUD endpoints. IDs go in the URL.

| Resource | Base path (aliases) | PK |
|---|---|---|
| Users | `/api/users` | user_id |
| Labs | `/api/labs` (`/api/laboratories`) | lab_id |
| Categories | `/api/categories` | category_id |
| Equipment | `/api/equipment` | equipment_id |
| Complaints | `/api/complaints` | complaint_id |
| Assignments | `/api/assignments` | assignment_id |
| Repairs | `/api/repairs` | repair_id |
| Maintenance logs | `/api/maintenance` (`/api/maintenance-logs`) | log_id |

Standard endpoints (replace `{base}`):
- `GET {base}` → `{ count, data: [...] }`  (filters: `?status=WORKING&lab_id=1`, `?order=name&asc=false`, `?limit=10`)
- `GET {base}/:id` → `{ data }`
- `POST {base}` → `201 { message, data }`
- `PUT|PATCH {base}/:id` → `{ message, data }`
- `DELETE {base}/:id` → `{ message, data }`
- Errors: `{ error, hint, code }` with status 400 / 404 / 409.

Extra endpoints
| Method + path | What it does |
|---|---|
| `GET /api/equipment/details` | Equipment + lab name + category name (JOIN view) |
| `PATCH /api/equipment/:id/status` `{status}` | Calls `fn_update_equipment_status` |
| `GET /api/complaints/pending` | Pending complaints with equipment + reporter (view) |
| `POST /api/assignments` `{complaint_id, technician_id, assigned_by}` | Calls `fn_assign_complaint` |
| `GET /api/assignments/details` | Assignments with technician/admin/equipment names (view) |
| `POST /api/assignments/:id/complete` | Calls `fn_complete_assignment` |
| `GET /api/repairs/history` | Repairs with complaint, equipment, lab, technician (view) |
| `POST /api/repairs/:id/complete` `{repair_description?, repair_cost?}` | Calls `fn_complete_repair` |
| `GET /api/maintenance/details?equipment_id=1` | Maintenance log with equipment names (view) |
| `GET /api/reports/repair-cost` | Repairs + total cost per lab |
| `GET /api/reports/dashboard` | Totals for dashboard cards |
| `GET /api/reports/complaint-summary` | Complaints per status |
| `GET /api/reports/equipment-status` | Equipment per status |
| `GET /api/reports/lab-report` | Per-lab equipment counts |
