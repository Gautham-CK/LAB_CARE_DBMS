
import { useEffect, useState } from 'react';
import {
  AlertTriangle, Building2, Package, Plus, Pencil,
  Trash2, RefreshCw, X, CheckCircle
} from 'lucide-react';

import PageHeading from '../components/PageHeading.jsx';
import { api, resourcesApi } from '../services/api.js';

const empty = {};

const definitions = {
  laboratories: {
    title: 'Laboratory',
    api: 'laboratories',
    id: 'lab_id',
    fields: [
      ['lab_name', 'Laboratory Name', 'text', true],
      ['building', 'Building', 'text'],
      ['floor', 'Floor', 'number'],
      ['capacity', 'Capacity', 'number', true],
    ],
    columns: ['lab_id', 'lab_name', 'building', 'floor', 'capacity'],
  },

  equipment: {
    title: 'Equipment',
    api: 'equipment',
    id: 'equipment_id',
    fields: [
      ['lab_id', 'Laboratory', 'select', true, 'laboratories'],
      ['category_id', 'Category', 'select', true, 'categories'],
      ['asset_tag', 'Asset Tag', 'text', true],
      ['equipment_name', 'Equipment Name', 'text', true],
      ['brand', 'Brand', 'text'],
      ['status', 'Status', 'select', false, 'equipmentStatus'],
      ['purchase_date', 'Purchase Date', 'date'],
    ],
    columns: [
      'equipment_id', 'asset_tag', 'equipment_name',
      'brand', 'lab_id', 'category_id', 'status', 'purchase_date'
    ],
  },

  categories: {
    title: 'Category',
    api: 'categories',
    id: 'category_id',
    fields: [
      ['category_name', 'Category Name', 'text', true],
      ['description', 'Description', 'textarea'],
    ],
    columns: ['category_id', 'category_name', 'description'],
  },

  complaints: {
    title: 'Complaint',
    api: 'complaints',
    id: 'complaint_id',
    fields: [
      ['equipment_id', 'Equipment', 'select', true, 'equipment'],
      ['user_id', 'Reported By', 'select', true, 'users'],
      ['issue_type', 'Issue Type', 'text', true],
      ['description', 'Description', 'textarea', true],
      ['priority', 'Priority', 'select', true, 'priority'],
    ],
    columns: [
      'complaint_id', 'equipment_id', 'user_id',
      'issue_type', 'description', 'priority', 'status', 'complaint_date'
    ],
  },

  assignments: {
    title: 'Technician Assignment',
    api: 'assignments',
    id: 'assignment_id',
    fields: [
      ['complaint_id', 'Complaint', 'select', true, 'complaints'],
      ['technician_id', 'Technician', 'select', true, 'technicians'],
      ['assigned_by', 'Assigned By (Admin)', 'select', true, 'admins'],
    ],
    columns: [
      'assignment_id', 'complaint_id', 'technician_id',
      'assigned_by', 'assigned_date', 'status'
    ],
  },

  repairs: {
    title: 'Repair',
    api: 'repairs',
    id: 'repair_id',
    fields: [
      ['complaint_id', 'Complaint', 'select', true, 'complaints'],
      ['technician_id', 'Technician', 'select', true, 'technicians'],
      ['repair_description', 'Repair Description', 'textarea'],
      ['repair_cost', 'Repair Cost', 'number'],
    ],
    columns: [
      'repair_id', 'complaint_id', 'technician_id',
      'repair_date', 'repair_description', 'repair_cost', 'repair_status'
    ],
  },

  maintenance: {
    title: 'Maintenance History',
    api: 'maintenance',
    id: 'log_id',
    fields: [
      ['equipment_id', 'Equipment', 'select', true, 'equipment'],
      ['repair_id', 'Related Repair (optional)', 'select', false, 'repairs'],
      ['action', 'Maintenance Action', 'text', true],
      ['remarks', 'Remarks', 'textarea'],
    ],
    columns: [
      'log_id', 'equipment_id', 'repair_id', 'action', 'remarks', 'log_date'
    ],
  },
};

const options = {
  equipmentStatus: [
    'WORKING', 'FAULTY', 'UNDER_REPAIR', 'RETIRED'
  ],
  priority: ['LOW', 'MEDIUM', 'HIGH'],
};

function rows(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function getError(error) {
  return error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    'Something went wrong.';
}

export default function ResourcePage({ resource }) {
  const path = resource.path;
  const config = definitions[path];

  const [records, setRecords] = useState([]);
  const [lookups, setLookups] = useState({});
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);

  async function loadRecords() {
    if (!config) return;

    setLoading(true);
    setError('');

    try {
      let listRequest;

      if (path === 'assignments') {
        listRequest = api.get('/api/assignments/details');
      } else if (path === 'repairs') {
        listRequest = api.get('/api/repairs/history');
      } else if (path === 'maintenance') {
        listRequest = api.get('/api/maintenance/details');
      } else {
        listRequest = resourcesApi[config.api].list();
      }

      const requests = [listRequest];

      const dependencies = {
        equipment: ['laboratories', 'categories'],
        complaints: ['equipment', 'users'],
        assignments: ['complaints', 'users'],
        repairs: ['complaints', 'users'],
        maintenance: ['equipment', 'repairs'],
      };

      const needed = dependencies[path] || [];

      for (const name of needed) {
        requests.push(resourcesApi[name].list());
      }

      const results = await Promise.all(requests);

      setRecords(rows(results[0]));

      const lookupData = {};

      needed.forEach((name, index) => {
        lookupData[name] = rows(results[index + 1]);
      });

      if (path === 'assignments' || path === 'repairs') {
        const users = lookupData.users || [];

        lookupData.technicians = users.filter(
          user => user.role === 'TECHNICIAN'
        );

        lookupData.admins = users.filter(
          user => user.role === 'ADMIN'
        );
      }

      setLookups(lookupData);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [path]);

  function openAdd() {
    setEditingId(null);
    setForm({});
    setError('');
    setModalOpen(true);
  }

  function openEdit(record) {
    setEditingId(record[config.id]);

    const values = {};

    config.fields.forEach(([key]) => {
      values[key] = record[key] ?? '';
    });

    setForm(values);
    setError('');
    setModalOpen(true);
  }

  function changeField(key, value) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function buildPayload() {
    const payload = {};

    config.fields.forEach(([key, , type]) => {
      const value = form[key];

      if (value === undefined || value === '') return;

      if (
        type === 'number' ||
        (
          type === 'select' &&
          [
            'lab_id', 'category_id', 'equipment_id', 'user_id',
            'complaint_id', 'technician_id', 'assigned_by',
            'repair_id'
          ].includes(key)
        )
      ) {
        payload[key] = Number(value);
      } else {
        payload[key] = value;
      }
    });

    if (
      path === 'repairs' &&
      !editingId &&
      payload.repair_cost === undefined
    ) {
      payload.repair_cost = 0;
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = buildPayload();

      if (editingId !== null) {
        await resourcesApi[config.api].update(editingId, payload);
      } else {
        await resourcesApi[config.api].create(payload);
      }

      setModalOpen(false);
      await loadRecords();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const id = record[config.id];

    if (!window.confirm(
      `Delete this ${config.title}? This may be blocked if other records reference it.`
    )) return;

    setError('');

    try {
      await resourcesApi[config.api].remove(id);
      await loadRecords();
    } catch (err) {
      setError(getError(err));
    }
  }

  async function completeRecord(record) {
    const id = record[config.id];

    setWorkingId(id);
    setError('');

    try {
      if (path === 'assignments') {
        await api.post(`/api/assignments/${id}/complete`);
      } else if (path === 'repairs') {
        await api.post(`/api/repairs/${id}/complete`, {
          repair_description: record.repair_description || null,
          repair_cost: record.repair_cost ?? null,
        });
      }

      await loadRecords();
    } catch (err) {
      setError(getError(err));
    } finally {
      setWorkingId(null);
    }
  }

  function displayValue(key, value) {
    const lookupNames = {
      lab_id: ['laboratories', 'lab_id', 'lab_name'],
      category_id: ['categories', 'category_id', 'category_name'],
      equipment_id: ['equipment', 'equipment_id', 'equipment_name'],
      user_id: ['users', 'user_id', 'name'],
      technician_id: ['technicians', 'user_id', 'name'],
      assigned_by: ['admins', 'user_id', 'name'],
      complaint_id: ['complaints', 'complaint_id', 'issue_type'],
      repair_id: ['repairs', 'repair_id', 'repair_description'],
    };

    const mapping = lookupNames[key];

    if (mapping) {
      const [list, idKey, labelKey] = mapping;

      const found = (lookups[list] || []).find(
        item => String(item[idKey]) === String(value)
      );

      return found ? found[labelKey] : `#${value ?? '-'}`;
    }

    return value === null || value === undefined || value === ''
      ? '-'
      : String(value);
  }

  if (!config) {
    return (
      <section className="panel resource-empty">
        <AlertTriangle size={30} />
        <h2>{resource.title}</h2>
        <p>This module is not configured.</p>
      </section>
    );
  }

  return (
    <>
      <PageHeading
        title={resource.title}
        description={resource.description}
        action={
          <button className="button button-primary" onClick={openAdd}>
            <Plus size={17} /> Add {config.title}
          </button>
        }
      />

      <section className="resource-summary">
        <div className="resource-summary-icon">
          {path === 'laboratories'
            ? <Building2 size={22} />
            : <Package size={22} />}
        </div>

        <div>
          <strong>{config.title} Management</strong>
          <span>Records stored in Supabase</span>
        </div>

        <div className="resource-summary-status">
          <span className="connection-dot" />
          Connected
        </div>
      </section>

      {error && (
        <div className="notice notice-error">
          <AlertTriangle size={17} />
          <div>{error}</div>
        </div>
      )}

      <section className="panel" style={{ padding: 18 }}>
        <div className="panel-heading" style={{ marginBottom: 18 }}>
          <div>
            <h2>All {resource.title} ({records.length})</h2>
            <p>Manage records in your LabCare database.</p>
          </div>

          <button
            className="button button-secondary button-small"
            onClick={loadRecords}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading records...</p>
        ) : records.length === 0 ? (
          <div className="empty-panel">
            <Package size={28} />
            <strong>No records found</strong>
            <p>Add your first record to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 12,
            }}>
              <thead>
                <tr style={{ background: '#f6f8fb', color: '#718198' }}>
                  {config.columns.map(key => (
                    <th key={key} style={{
                      padding: 13,
                      whiteSpace: 'nowrap'
                    }}>
                      {key.replaceAll('_', ' ')}
                    </th>
                  ))}
                  <th style={{ padding: 13 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {records.map(record => (
                  <tr key={record[config.id]} style={{
                    borderBottom: '1px solid #e8edf3'
                  }}>
                    {config.columns.map(key => (
                      <td key={key} style={{
                        padding: 13,
                        minWidth: 85,
                        maxWidth: 240,
                      }}>
                        {displayValue(key, record[key])}
                      </td>
                    ))}

                    <td style={{
                      padding: 13,
                      whiteSpace: 'nowrap'
                    }}>
                      <button
                        className="icon-button"
                        title="Edit"
                        onClick={() => openEdit(record)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="icon-button"
                        title="Delete"
                        onClick={() => handleDelete(record)}
                      >
                        <Trash2 size={16} color="#d47785" />
                      </button>

                      {(path === 'assignments' || path === 'repairs') &&
                       !['COMPLETED', 'RESOLVED'].includes(
                         String(
                           record.status ||
                           record.repair_status ||
                           ''
                         ).toUpperCase()
                       ) && (
                        <button
                          className="icon-button"
                          title="Complete"
                          disabled={workingId === record[config.id]}
                          onClick={() => completeRecord(record)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: '#172b4370',
          display: 'grid',
          placeItems: 'center',
          padding: 16,
        }}>
          <section className="panel" style={{
            width: 'min(460px, 100%)',
            padding: 23,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div className="panel-heading">
              <h2>
                {editingId !== null ? 'Edit' : 'Add'} {config.title}
              </h2>

              <button
                className="icon-button"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {config.fields.map(
                ([key, label, type, required, source]) => {
                  const choices =
                    source === 'equipmentStatus' ||
                    source === 'priority'
                      ? options[source]
                      : source
                        ? lookups[source] || []
                        : [];

                  const choiceId = {
                    laboratories: 'lab_id',
                    categories: 'category_id',
                    equipment: 'equipment_id',
                    users: 'user_id',
                    technicians: 'user_id',
                    admins: 'user_id',
                    complaints: 'complaint_id',
                    repairs: 'repair_id',
                  }[source];

                  const choiceLabel = {
                    laboratories: 'lab_name',
                    categories: 'category_name',
                    equipment: 'equipment_name',
                    users: 'name',
                    technicians: 'name',
                    admins: 'name',
                    complaints: 'issue_type',
                    repairs: 'repair_description',
                  }[source];

                  return (
                    <div key={key}>
                      <label className="field-label">
                        {label}{required ? ' *' : ''}
                      </label>

                      {type === 'select' ? (
                        <select
                          className="plain-input"
                          value={form[key] ?? ''}
                          onChange={e =>
                            changeField(key, e.target.value)
                          }
                          required={!!required}
                        >
                          <option value="">
                            Select {label}
                          </option>

                          {choices.map(item => {
                            const value =
                              source === 'equipmentStatus' ||
                              source === 'priority'
                                ? item
                                : item[choiceId];

                            const text =
                              source === 'equipmentStatus' ||
                              source === 'priority'
                                ? item
                                : `${item[choiceLabel] || 'Record'} (#${value})`;

                            return (
                              <option key={value} value={value}>
                                {text}
                              </option>
                            );
                          })}
                        </select>
                      ) : type === 'textarea' ? (
                        <textarea
                          className="plain-input"
                          rows="3"
                          value={form[key] ?? ''}
                          onChange={e =>
                            changeField(key, e.target.value)
                          }
                          required={!!required}
                        />
                      ) : (
                        <input
                          className="plain-input"
                          type={type}
                          value={form[key] ?? ''}
                          onChange={e =>
                            changeField(key, e.target.value)
                          }
                          required={!!required}
                          min={type === 'number' ? '0' : undefined}
                        />
                      )}
                    </div>
                  );
                }
              )}

              <button
                className="button button-primary auth-submit"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Record'
                    : 'Save Record'}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
