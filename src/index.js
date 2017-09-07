import './packages/theme-default/lib/table.css'
import './packages/theme-default/lib/table-column.css'
import './packages/theme-default/lib/checkbox-group.css'
import './packages/theme-default/lib/checkbox.css'
import './packages/theme-default/lib/dropdown-item.css'
import './packages/theme-default/lib/dropdown-menu.css'
import './packages/theme-default/lib/dropdown.css'
import './packages/theme-default/lib/tag.css'
import './packages/theme-default/lib/tooltip.css'
import vTable from './packages/table'
import vTableColumn from './packages/table-column'
import table from './table'
table.table = vTable
table.tableColumn = vTableColumn
export default table