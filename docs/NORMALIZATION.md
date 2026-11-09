# LabCare – Normalization (1NF, 2NF, 3NF)

**Normalization** = organising tables so each fact is stored in exactly one place.
This avoids duplicate data and three kinds of problems:
*insert anomaly* (can't add a fact without another), *update anomaly* (change in many rows) and *delete anomaly* (deleting a row loses unrelated facts).

## Step 0 – What an un-normalized LabCare would look like

One big table `lab_records`:

| lab_name | building | equipment | brand | category | cat_description | complaint_by | user_email | issues |
|---|---|---|---|---|---|---|---|---|
| Computer Lab 1 | Block A | Desktop | Dell | Computer Equipment | PCs, laptops… | Test User | t@x.com | "no display, slow" |

Problems: the lab's building is repeated for every equipment; the category description is repeated; one cell holds several issues; renaming a category means editing hundreds of rows.

## 1NF – First Normal Form
**Rule:** every cell holds ONE atomic value, no repeating groups, every row has a primary key.

**How LabCare follows it**
- Each of the 8 tables has a BIGINT primary key (`user_id`, `lab_id`, `equipment_id`, …).
- No cell holds a list: many issues for an equipment are **many rows** in `complaint`, not one comma-separated cell.
- Each column holds one kind of value (`phone` one number, `purchase_date` one date).

## 2NF – Second Normal Form
**Rule:** be in 1NF **and** no non-key column depends on only *part* of a composite key.
(Only matters for composite keys; with a single-column key 2NF is automatically satisfied.)

**How LabCare follows it**
- Every table uses a single-column surrogate primary key, so there are no partial dependencies.
- Facts were still split to the right owner: lab data (`building`, `floor`, `capacity`) lives only in `lab`, depends on `lab_id`; category `description` lives only in `category`.
- Example of what 2NF prevents: if `assignment` used the key (`complaint_id`, `technician_id`) and stored `technician_name`, the name would depend only on `technician_id` (part of the key). LabCare stores only the id and the name stays in `labcare_user`.

## 3NF – Third Normal Form
**Rule:** be in 2NF **and** no non-key column depends on another non-key column (no transitive dependency).
*"Every non-key attribute depends on the key, the whole key, and nothing but the key."*

**How LabCare follows it**

| Table | Why it is in 3NF |
|---|---|
| `labcare_user` | name, email, phone, role, department all describe the user (`user_id`). |
| `lab` | building, floor, capacity describe the lab only. |
| `category` | name and description describe the category only. |
| `equipment` | Stores `lab_id` and `category_id` (FKs) – **not** `lab_name` or `category_name`. Those would depend on `lab_id`/`category_id` (non-key) → transitive. Names are obtained with a JOIN (see view `v_equipment_details`). |
| `complaint` | Stores `equipment_id` and `user_id` – not equipment name or user name. |
| `assignment` | Stores `complaint_id`, `technician_id`, `assigned_by` – names come from `labcare_user` via JOIN (see view `v_technician_assignments`). Both technician and admin are rows of the same `labcare_user` table (one table, two roles) instead of two duplicate tables. |
| `repair`, `maintenance_log` | Hold only facts about the repair / log entry and reference other tables by FK (repair → complaint + technician; maintenance_log → equipment + repair). |

## Relationships (all one-to-many)
- `lab` 1 → N `equipment`
- `category` 1 → N `equipment`
- `equipment` 1 → N `complaint`
- `labcare_user` 1 → N `complaint` (reporter)
- `complaint` 1 → N `assignment` (a complaint can be re-assigned over time)
- `labcare_user` 1 → N `assignment` as technician; `labcare_user` 1 → N `assignment` as admin (`assigned_by`)

## Honest discussion points (good for viva)
- `role` and `status`/`priority` are stored as VARCHAR with CHECK constraints. A stricter design would use lookup tables; CHECK is a deliberate, simpler choice.
- Intentional controlled redundancy: none of the tables store derived data; counts and names come from views/functions.
- `equipment.status` is updated by triggers – it is a state, not a copy of other data, so it does not break 3NF.
