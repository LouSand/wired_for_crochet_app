import Link from 'next/link'
import { getCustomers } from '@/lib/actions/customers'
import { getProjectInvoiceData } from '@/lib/actions/project-to-invoice'
import InvoiceForm from '@/components/invoicing/invoice-form'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const projectId = typeof params.from_project === 'string' ? params.from_project : undefined

  const { data: customers } = await getCustomers()

  // If coming from a project, pre-populate invoice data
  let prefillInvoice: {
    customer_id?: string
    project_id?: string
    items: { description: string; quantity: number; unit_price: number }[]
  } | undefined

  let projectName: string | undefined

  if (projectId) {
    const { data: projectData } = await getProjectInvoiceData(projectId)
    if (projectData) {
      projectName = projectData.projectName
      prefillInvoice = {
        customer_id: projectData.customerId ?? undefined,
        project_id: projectData.projectId,
        items: projectData.items,
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/invoicing/invoices"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Invoices
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="mt-1 text-sm text-gray-600">
          {projectName
            ? `Creating invoice from project: ${projectName}`
            : 'Create a new invoice for a customer.'}
        </p>
      </div>

      {projectName && (
        <div className="mb-4 rounded-md bg-purple-50 border border-purple-200 p-3">
          <p className="text-sm text-purple-700">
            <span className="font-medium">Pre-filled from project:</span> {projectName}.
            Review the line items below and adjust as needed before saving.
          </p>
        </div>
      )}

      <InvoiceForm
        customers={(customers ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
        }))}
        prefill={prefillInvoice}
      />
    </div>
  )
}
